import { registerAdminRoutes } from '../admin/routes.js';
import { jurisdictionRule, quotationRule, formatLegalContext } from '../src/utils/legalPolicy.js';
/* global process, Buffer */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchLegalDatabase } from '../src/utils/legalSearch.js';

// Load environmental variables
dotenv.config({ path: process.env.ENV_FILE || path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve paths for local file persistence
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || __dirname;
fs.mkdirSync(DATA_DIR, { recursive: true });
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Middleware
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'https://what-does-nigeria-law-says.thispage.xyz,https://what-does-nigerian-law-say.vercel.app')
  .split(',').map(origin => origin.trim()).filter(Boolean);
allowedOrigins.push(...(process.env.ADMIN_ORIGINS || 'https://admin.what-does-nigeria-law-says.thispage.xyz')
  .split(',').map(origin => origin.trim()).filter(Boolean));
if (process.env.NODE_ENV !== 'production') allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
app.use(cors({
  origin(origin, callback) { callback(null, !origin || allowedOrigins.includes(origin)); }
}));
app.use(express.json({ limit: '25mb' }));

// In-memory analytics database state
let analyticsData = {
  visits: [],
  registrations: [],
  questions: [],
  articles: []
};

function createAnalyticsId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanString(value, maxLength = 240) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeEmail(value) {
  return cleanString(value, 180).toLowerCase();
}

function normalizeUserPayload(user = {}) {
  const safeUser = user && typeof user === 'object' ? user : {};
  return {
    id: cleanString(safeUser.id || safeUser.userId, 120),
    email: normalizeEmail(safeUser.email),
    name: cleanString(safeUser.name || safeUser.displayName, 120)
  };
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '';
}

function normalizeAnalyticsCategory(category) {
  const value = cleanString(category, 120).toLowerCase();

  if (!value) return '';
  if (/succession|inheritance|estate|probate|intestate|customary/.test(value)) return 'Succession & Inheritance';
  if (/family|matrimonial|marriage|divorce|custody|maintenance/.test(value)) return 'Family Law';
  if (/land|property|occupancy|lease|tenan|rent|house/.test(value)) return 'Land & Property';
  if (/criminal|penal|crime|offence|offense/.test(value)) return 'Criminal Law';
  if (/right|constitution|liberty|detention|police|bail|fair hearing/.test(value)) return 'Fundamental Rights';
  if (/traffic|road|vehicle|tow|towing|accident|collision/.test(value)) return 'Road Traffic';
  if (/animal|cruelty|dog|pet|livestock/.test(value)) return 'Animal Cruelty';
  if (/election|electoral|bvas|inec/.test(value)) return 'Elections';

  return category || 'General Nigerian Law';
}

function categorizeQuestion(text, localMatch = {}) {
  const sourceCategory = (localMatch.sources || [])
    .map(source => normalizeAnalyticsCategory(source.category || source.act || source.title))
    .find(Boolean);

  if (sourceCategory) return sourceCategory;

  const value = cleanString(text, 1200).toLowerCase();

  if (/succession|inherit|estate|probate|intestate|will|first son|eldest|family property|share property|father died|dad died/.test(value)) {
    return 'Succession & Inheritance';
  }
  if (/marry|marriage|divorce|custody|maintenance|wife|husband|spouse|child support|forced marriage|remarry/.test(value)) {
    return 'Family Law';
  }
  if (/land|property|house|tenant|landlord|rent|lease|certificate of occupancy|c of o|governor revoke|adverse possession|squat|living there/.test(value)) {
    return 'Land & Property';
  }
  if (/car|vehicle|road|traffic|tow|towed|towing|accident|collision|jammed|hit from|lastma|vio|parking/.test(value)) {
    return 'Road Traffic';
  }
  if (/dog|animal|pet|chicken|livestock|cruelty|poison/.test(value)) {
    return 'Animal Cruelty';
  }
  if (/election|electoral|bvas|inec|vote|polling|candidate/.test(value)) {
    return 'Elections';
  }
  if (/arrest|police|bail|detention|liberty|fundamental right|human right|torture|fair hearing/.test(value)) {
    return 'Fundamental Rights';
  }
  if (/steal|theft|murder|kill|assault|fraud|criminal|crime|offence|offense|punishment/.test(value)) {
    return 'Criminal Law';
  }

  return 'General Nigerian Law';
}

function ensureAnalyticsShape() {
  analyticsData.visits = Array.isArray(analyticsData.visits) ? analyticsData.visits : [];
  analyticsData.registrations = Array.isArray(analyticsData.registrations) ? analyticsData.registrations : [];
  analyticsData.questions = Array.isArray(analyticsData.questions) ? analyticsData.questions : [];
  analyticsData.articles = Array.isArray(analyticsData.articles) ? analyticsData.articles : [];

  analyticsData.registrations = analyticsData.registrations.map(reg => {
    const timestamp = Number(reg.timestamp || reg.firstSeen || reg.lastSeen || Date.now());
    return {
      ...reg,
      email: normalizeEmail(reg.email),
      userId: cleanString(reg.userId || reg.id, 120),
      name: cleanString(reg.name, 120),
      timestamp,
      firstSeen: Number(reg.firstSeen || timestamp),
      lastSeen: Number(reg.lastSeen || timestamp),
      visitCount: Number(reg.visitCount || 0),
      questionCount: Number(reg.questionCount || 0),
      categoryCounts: reg.categoryCounts && typeof reg.categoryCounts === 'object' ? reg.categoryCounts : {},
      searchHistory: Array.isArray(reg.searchHistory) ? reg.searchHistory.slice(0, 25) : []
    };
  }).filter(reg => reg.email);

  analyticsData.questions = analyticsData.questions.map(question => ({
    ...question,
    id: question.id || createAnalyticsId('q'),
    text: cleanString(question.text, 1200),
    timestamp: Number(question.timestamp || Date.now()),
    category: question.category || categorizeQuestion(question.text),
    email: normalizeEmail(question.email),
    userId: cleanString(question.userId, 120),
    userName: cleanString(question.userName, 120),
    chatId: cleanString(question.chatId, 120),
    sessionId: cleanString(question.sessionId, 120),
    sourceCategories: Array.isArray(question.sourceCategories) ? question.sourceCategories : []
  })).filter(question => question.text);

  rebuildRegistrationSearchStats();
}

function upsertRegistration(user, updates = {}) {
  const normalized = normalizeUserPayload(user);
  if (!normalized.email) return null;

  let existing = analyticsData.registrations.find(reg => reg.email === normalized.email);
  const now = Date.now();

  if (!existing) {
    existing = {
      email: normalized.email,
      userId: normalized.id,
      name: normalized.name,
      timestamp: now,
      firstSeen: now,
      lastSeen: now,
      subscribed: true,
      visitCount: 0,
      questionCount: 0,
      categoryCounts: {},
      searchHistory: []
    };
    analyticsData.registrations.push(existing);
  }

  existing.userId = normalized.id || existing.userId || '';
  existing.name = normalized.name || existing.name || '';
  existing.timestamp = now;
  existing.lastSeen = now;
  existing.firstSeen = existing.firstSeen || now;
  existing.visitCount = Number(existing.visitCount || 0);
  existing.questionCount = Number(existing.questionCount || 0);
  existing.categoryCounts = existing.categoryCounts && typeof existing.categoryCounts === 'object'
    ? existing.categoryCounts
    : {};
  existing.searchHistory = Array.isArray(existing.searchHistory) ? existing.searchHistory : [];

  if (typeof updates.subscribed === 'boolean') {
    existing.subscribed = updates.subscribed;
  }
  if (updates.incrementVisit) {
    existing.visitCount += 1;
  }

  return existing;
}

function updateRegisteredSearchStats(questionRecord) {
  if (!questionRecord.email) return;

  const reg = upsertRegistration({
    email: questionRecord.email,
    id: questionRecord.userId,
    name: questionRecord.userName
  });

  if (!reg) return;

  reg.questionCount = Number(reg.questionCount || 0) + 1;
  reg.lastQuestion = questionRecord.text;
  reg.lastQuestionAt = questionRecord.timestamp;
  reg.categoryCounts[questionRecord.category] = Number(reg.categoryCounts[questionRecord.category] || 0) + 1;
  reg.searchHistory = [
    {
      text: questionRecord.text,
      category: questionRecord.category,
      timestamp: questionRecord.timestamp,
      chatId: questionRecord.chatId,
      sessionId: questionRecord.sessionId
    },
    ...reg.searchHistory
  ].slice(0, 25);
}

function rebuildRegistrationSearchStats() {
  const byEmail = new Map();

  for (const reg of analyticsData.registrations) {
    reg.questionCount = 0;
    reg.categoryCounts = {};
    reg.searchHistory = [];
    delete reg.lastQuestion;
    delete reg.lastQuestionAt;
    byEmail.set(reg.email, reg);
  }

  const questions = [...analyticsData.questions]
    .filter(question => question.email)
    .sort((a, b) => b.timestamp - a.timestamp);

  for (const question of questions) {
    const email = normalizeEmail(question.email);
    if (!email) continue;

    let reg = byEmail.get(email);
    if (!reg) {
      reg = {
        email,
        userId: cleanString(question.userId, 120),
        name: cleanString(question.userName, 120),
        timestamp: question.timestamp,
        firstSeen: question.timestamp,
        lastSeen: question.timestamp,
        subscribed: true,
        visitCount: 0,
        questionCount: 0,
        categoryCounts: {},
        searchHistory: []
      };
      analyticsData.registrations.push(reg);
      byEmail.set(email, reg);
    }

    reg.userId = cleanString(question.userId, 120) || reg.userId || '';
    reg.name = cleanString(question.userName, 120) || reg.name || '';
    reg.questionCount += 1;
    reg.categoryCounts[question.category] = Number(reg.categoryCounts[question.category] || 0) + 1;
    reg.lastSeen = Math.max(Number(reg.lastSeen || 0), Number(question.timestamp || 0));
    reg.timestamp = Math.max(Number(reg.timestamp || 0), Number(question.timestamp || 0));

    if (!reg.lastQuestionAt || question.timestamp > reg.lastQuestionAt) {
      reg.lastQuestion = question.text;
      reg.lastQuestionAt = question.timestamp;
    }

    if (reg.searchHistory.length < 25) {
      reg.searchHistory.push({
        text: question.text,
        category: question.category,
        timestamp: question.timestamp,
        chatId: question.chatId,
        sessionId: question.sessionId
      });
    }
  }
}

function buildSearchGroups(questions) {
  const groups = new Map();

  for (const question of questions) {
    const category = question.category || categorizeQuestion(question.text);
    if (!groups.has(category)) {
      groups.set(category, {
        category,
        count: 0,
        latestAt: 0,
        latestQuestions: []
      });
    }

    const group = groups.get(category);
    group.count += 1;
    group.latestAt = Math.max(group.latestAt, Number(question.timestamp || 0));

    if (group.latestQuestions.length < 5) {
      group.latestQuestions.push({
        text: question.text,
        timestamp: question.timestamp,
        email: question.email || ''
      });
    }
  }

  return [...groups.values()].sort((a, b) => b.count - a.count || b.latestAt - a.latestAt);
}

// Load analytics database from disk or seed it if missing
function loadAnalytics() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf8');
      analyticsData = JSON.parse(raw);
      ensureAnalyticsShape();
      console.log('📊 Loaded analytics database successfully.');
    } else {
      console.log('Analytics storage initialized with no sample records.');
      ensureAnalyticsShape();
      saveAnalytics();
    }
  } catch (err) {
    console.error('❌ Failed to load/seed analytics:', err.message);
  }
}

// Save analytics state back to local JSON file
function saveAnalytics() {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analyticsData, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Failed to save analytics database:', err.message);
  }
}

// Load database immediately on startup
loadAnalytics();

// Health Check Route for Render
app.get('/', (req, res) => {
  res.send('What Does Nigerian Law Say? Backend API is running successfully.');
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Multi-Provider AI Engine (Gemini, Groq Fallback, OpenAI)
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_GROQ_FALLBACK_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash';

function normalizeApiKey(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '').trim();
}

function isConfigured(value) {
  return normalizeApiKey(value).length > 0;
}

function normalizeProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  return ['auto', 'gemini', 'groq', 'openai'].includes(provider) ? provider : 'auto';
}

function shouldTryNextAiProvider(error) {
  const retryableStatuses = new Set([401, 403, 404, 429, 500, 502, 503, 504]);
  const message = error.message || '';
  return retryableStatuses.has(error.status) || /not configured|api key|authentication|unauthorized|forbidden|not found|not supported|high demand|overloaded|temporarily unavailable|quota/i.test(message);
}

async function callGemini(prompt, modelName, apiKey) {
  const generationConfig = {
    temperature: 0.25,
    topP: 0.9,
    maxOutputTokens: 1800
  };

  // Only thinking-capable models accept thinkingConfig; other models return 400 invalid argument.
  if (/gemini-(?:3\.[78]|2\.0.*thinking)/i.test(modelName)) {
    generationConfig.thinkingConfig = {
      thinkingBudget: 0
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig
      })
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.provider = 'gemini';
    throw error;
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

async function callOpenAiCompatibleProvider({ endpoint, apiKey, modelName, prompt, provider }) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are What Does Nigerian Law Say?, a Nigerian legal information assistant. Follow instructions exactly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.25,
      top_p: 0.9,
      max_tokens: 1800
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `${provider} request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.provider = provider;
    throw error;
  }

  const text = payload?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error(`${provider} returned an empty response.`);
  }

  return text;
}

async function callGeminiProvider(prompt, customKeys = {}, customModels = {}) {
  const apiKey = normalizeApiKey(customKeys?.geminiApiKey || customKeys?.geminiKey || process.env.GEMINI_API_KEY);

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured.');
    error.status = 503;
    error.provider = 'gemini';
    throw error;
  }

  const modelNames = [
    customModels?.geminiModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    customModels?.geminiFallbackModel || process.env.GEMINI_FALLBACK_MODEL || DEFAULT_GEMINI_FALLBACK_MODEL,
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash'
  ].filter(Boolean);

  let lastError;
  for (const modelName of [...new Set(modelNames)]) {
    try {
      return {
        text: await callGemini(prompt, modelName, apiKey),
        provider: 'gemini',
        model: modelName
      };
    } catch (error) {
      lastError = error;
      if (!shouldTryNextAiProvider(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function callGroq(prompt, customKeys = {}, customModels = {}) {
  const apiKey = normalizeApiKey(customKeys?.groqApiKey || customKeys?.groqKey || process.env.GROQ_API_KEY);

  if (!apiKey) {
    const error = new Error('GROQ_API_KEY is not configured.');
    error.status = 503;
    error.provider = 'groq';
    throw error;
  }

  const modelNames = [
    customModels?.groqModel || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    DEFAULT_GROQ_FALLBACK_MODEL,
    'openai/gpt-oss-20b',
    'llama-3.1-8b-instant'
  ].filter(Boolean);

  let lastError;
  for (const modelName of [...new Set(modelNames)]) {
    try {
      return {
        text: await callOpenAiCompatibleProvider({
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey,
          modelName,
          prompt,
          provider: 'groq'
        }),
        provider: 'groq',
        model: modelName
      };
    } catch (error) {
      lastError = error;
      if (!shouldTryNextAiProvider(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function callOpenAi(prompt, customKeys = {}, customModels = {}) {
  const apiKey = normalizeApiKey(customKeys?.openaiApiKey || customKeys?.openaiKey || process.env.OPENAI_API_KEY);

  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured.');
    error.status = 503;
    error.provider = 'openai';
    throw error;
  }

  const model = customModels?.openaiModel || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  return {
    text: await callOpenAiCompatibleProvider({
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey,
      modelName: model,
      prompt,
      provider: 'openai'
    }),
    provider: 'openai',
    model
  };
}

function buildProviderPlan(preferredProvider, fallbackProvider, customKeys = {}) {
  const preferred = normalizeProvider(preferredProvider || process.env.AI_PROVIDER || 'auto');
  const fallback = normalizeProvider(fallbackProvider || 'groq');

  const configuredProviders = {
    gemini: isConfigured(customKeys?.geminiApiKey || customKeys?.geminiKey || process.env.GEMINI_API_KEY),
    groq: isConfigured(customKeys?.groqApiKey || customKeys?.groqKey || process.env.GROQ_API_KEY),
    openai: isConfigured(customKeys?.openaiApiKey || customKeys?.openaiKey || process.env.OPENAI_API_KEY)
  };
  const onlyConfigured = (providers) => providers.filter(p => configuredProviders[p]);

  let order;
  if (preferred === 'auto' || preferred === 'gemini') {
    order = ['gemini', fallback !== 'gemini' ? fallback : 'groq', 'openai'];
  } else if (preferred === 'groq') {
    order = ['groq', fallback !== 'groq' ? fallback : 'gemini', 'openai'];
  } else if (preferred === 'openai') {
    order = ['openai', fallback !== 'openai' ? fallback : 'groq', 'gemini'];
  } else {
    order = ['gemini', 'groq', 'openai'];
  }

  const deduped = [...new Set(order)];
  const plan = onlyConfigured(deduped);
  return plan.length > 0 ? plan : deduped;
}

async function generateAiAnswer(prompt, preferredProvider, fallbackProvider, customKeys, customModels) {
  const providerPlan = buildProviderPlan(preferredProvider, fallbackProvider, customKeys);
  let lastError;
  const primaryProvider = providerPlan[0];

  for (let i = 0; i < providerPlan.length; i++) {
    const provider = providerPlan[i];
    try {
      let result;
      if (provider === 'gemini') result = await callGeminiProvider(prompt, customKeys, customModels);
      else if (provider === 'groq') result = await callGroq(prompt, customKeys, customModels);
      else if (provider === 'openai') result = await callOpenAi(prompt, customKeys, customModels);

      if (result) {
        return {
          ...result,
          fallbackUsed: i > 0,
          primaryProvider,
          providerPlan
        };
      }
    } catch (error) {
      console.warn(`[What Does Nigerian Law Say?] ${provider} failed (${error.message || error.status}). Attempting next provider in plan...`);
      lastError = error;
      if (!shouldTryNextAiProvider(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('No configured AI provider succeeded.');
}



const verifiedExamplesRule = `Verified public examples rule:
- STRICT PROHIBITION: DO NOT mention, cite, or formulate any case names in format "Party v. Party" or "X v. Y" unless that exact case name is explicitly written in the retrieved materials above.
- If no verified public example is available from the retrieved materials, you MUST say under **Verified public example:** exactly: "No verified public example is available from the current retrieved sources."
- Do not guess, invent, or rely on memory for case citations, law reports (NWLR, FWLR), dates, judges, or facts. Rely on statutory provisions and general principles of Nigerian law.
- Never call a case the locus classicus unless that exact case and status are verified from the retrieved materials.`;

const jurisdictionPatterns = [
  ['Abia State', /\babia\b/i],
  ['Adamawa State', /\badamawa\b/i],
  ['Akwa Ibom State', /\bakwa[\s-]?ibom\b/i],
  ['Anambra State', /\banambra\b/i],
  ['Bauchi State', /\bbauchi\b/i],
  ['Bayelsa State', /\bbayelsa\b/i],
  ['Benue State', /\bbenue\b/i],
  ['Borno State', /\bborno\b/i],
  ['Cross River State', /\bcross[\s-]?river\b/i],
  ['Delta State', /\bdelta\b/i],
  ['Ebonyi State', /\bebonyi\b/i],
  ['Edo State', /\bedo\b/i],
  ['Ekiti State', /\bekiti\b/i],
  ['Enugu State', /\benugu\b/i],
  ['Federal Capital Territory (Abuja)', /\b(fct|f\.c\.t\.|abuja|federal capital territory)\b/i],
  ['Gombe State', /\bgombe\b/i],
  ['Imo State', /\bimo\b/i],
  ['Jigawa State', /\bjigawa\b/i],
  ['Kaduna State', /\bkaduna\b/i],
  ['Kano State', /\bkano\b/i],
  ['Katsina State', /\bkatsina\b/i],
  ['Kebbi State', /\bkebbi\b/i],
  ['Kogi State', /\bkogi\b/i],
  ['Kwara State', /\bkwara\b/i],
  ['Lagos State', /\blagos\b/i],
  ['Nasarawa State', /\b(nasarawa|nassarawa)\b/i],
  ['Niger State', /\bniger state\b/i],
  ['Ogun State', /\bogun\b/i],
  ['Ondo State', /\bondo\b/i],
  ['Osun State', /\bosun\b/i],
  ['Oyo State', /\boyo\b/i],
  ['Plateau State', /\bplateau\b/i],
  ['Rivers State', /\brivers\b/i],
  ['Sokoto State', /\bsokoto\b/i],
  ['Taraba State', /\btaraba\b/i],
  ['Yobe State', /\byobe\b/i],
  ['Zamfara State', /\bzamfara\b/i],
  ['South East Nigeria', /\b(south[\s-]?east|southeastern nigeria|igbo land|igboland)\b/i],
  ['South South Nigeria', /\b(south[\s-]?south|niger delta)\b/i],
  ['South West Nigeria', /\b(south[\s-]?west|southwestern nigeria|yoruba land|yorubaland)\b/i],
  ['North Central Nigeria', /\b(north[\s-]?central|middle belt)\b/i],
  ['North East Nigeria', /\b(north[\s-]?east|northeastern nigeria)\b/i],
  ['North West Nigeria', /\b(north[\s-]?west|northwestern nigeria)\b/i],
  ['Northern Nigeria', /\bnorthern nigeria\b/i],
  ['Southern Nigeria', /\bsouthern nigeria\b/i]
];

function normalizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .slice(-10)
    .map(item => ({
      role: item.role,
      content: item.content.trim().slice(0, 1200)
    }))
    .filter(item => item.content.length > 0);
}

function detectJurisdictions(text) {
  if (!text) return [];
  const matches = [];

  for (const [label, pattern] of jurisdictionPatterns) {
    if (pattern.test(text) && !matches.includes(label)) {
      matches.push(label);
    }
  }

  return matches;
}

function buildConversationMemory(message, history) {
  const currentJurisdictions = detectJurisdictions(message);
  const previousJurisdictions = [];
  let latestPreviousJurisdiction = '';

  for (const turn of history) {
    const detected = detectJurisdictions(turn.content);
    if (detected.length > 0) {
      latestPreviousJurisdiction = detected[detected.length - 1];
    }
    for (const label of detected) {
      if (!previousJurisdictions.includes(label)) {
        previousJurisdictions.push(label);
      }
    }
  }

  const activeJurisdiction = currentJurisdictions[0] || latestPreviousJurisdiction || '';
  const historyText = history.length
    ? history.map((turn, index) => `${index + 1}. ${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`).join('\n')
    : 'No earlier turns in this chat.';

  return `Conversation memory:
Use this memory only to understand follow-up questions, earlier facts, parties, dates, locations, and the active jurisdiction. Do not repeat the whole history back to the user.

Previous turns in this same chat:
${historyText}

Jurisdiction memory:
- Current message mentions: ${currentJurisdictions.length ? currentJurisdictions.join(', ') : 'none'}
- Earlier turns mention: ${previousJurisdictions.length ? previousJurisdictions.join(', ') : 'none'}
- Active jurisdiction to apply: ${activeJurisdiction || 'none yet; ask for the state/region if the law may differ'}`;
}

function buildSearchText(message, history) {
  const recentUserContext = history
    .filter(turn => turn.role === 'user')
    .slice(-3)
    .map(turn => turn.content)
    .join('\n');

  return `${recentUserContext}\n${message}`.trim();
}

function getPublicGeminiError(err) {
  const message = err?.message || '';

  if (/429|too many requests|quota|rate limit|rate-limits|retryDelay/i.test(message)) {
    return {
      status: 429,
      code: 'GEMINI_QUOTA_LIMIT',
      message: 'Gemini is temporarily busy or quota-limited. Please try again in about 1 minute.'
    };
  }

  if (/503|overloaded|high demand|temporarily unavailable|unavailable/i.test(message)) {
    return {
      status: 503,
      code: 'GEMINI_TEMPORARILY_BUSY',
      message: 'Gemini is temporarily busy. Please try again shortly.'
    };
  }

  if (/401|403|api key|authentication|permission|unauthorized|forbidden/i.test(message)) {
    return {
      status: 503,
      code: 'GEMINI_CONFIGURATION_ERROR',
      message: 'The AI service is not available right now. Please contact support if this continues.'
    };
  }

  return {
    status: 502,
    code: 'GEMINI_REQUEST_FAILED',
    message: 'The AI service could not complete that answer right now. Please try again.'
  };
}

function extractCaseAuthorities(text) {
  const value = cleanString(text, 4000);
  const authorities = new Set();

  const casePatterns = [
    /\b[A-Z][A-Za-z0-9&.,'’ -]{2,80}\s+v\.?\s+[A-Z][A-Za-z0-9&.,'’ -]{2,80}(?:\s+\(\d{4}\)[A-Za-z0-9 .()/-]{0,80})?/g
  ];

  for (const pattern of casePatterns) {
    for (const match of value.matchAll(pattern)) {
      const cleaned = match[0]
        .replace(/\s+/g, ' ')
        .replace(/[.,;:\s]+$/, '')
        .trim();

      if (cleaned.length >= 8 && cleaned.length <= 180) {
        authorities.add(cleaned);
      }
    }
  }

  return [...authorities].slice(0, 6);
}

function normalizeAuthorityText(value) {
  return cleanString(value, 240)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUnverifiedCaseAuthorities(answerText, verifiedText = '') {
  const verified = normalizeAuthorityText(verifiedText);

  return extractCaseAuthorities(answerText).filter(authority => {
    const normalized = normalizeAuthorityText(authority);
    return normalized && !verified.includes(normalized);
  });
}

function sanitizeResponseText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s*[—―]\s*/g, ', ')
    .replace(/\s*–\s*/g, ' - ')
    .replace(/^I am What Does Nigerian Law Say\b[^.\n]*\.[^.\n]*\.\s*/i, '')
    .replace(/^(?:Hello!?|Hi!?|Greetings!?)\s*I am What Does Nigerian Law Say\b[^.\n]*\.\s*/i, '')
    .trim();
}

async function generateVerifiedAiAnswer(prompt, verifiedText = '', preferredProvider = 'auto', fallbackProvider = 'groq', customKeys = {}, customModels = {}) {
  const firstDraft = await generateAiAnswer(prompt, preferredProvider, fallbackProvider, customKeys, customModels);
  const unverifiedAuthorities = findUnverifiedCaseAuthorities(firstDraft.text, verifiedText);

  if (unverifiedAuthorities.length === 0) {
    return firstDraft;
  }

  try {
    const rewritePrompt = `${prompt}

The previous draft named these case examples or public authorities, but they were not verified in the retrieved materials:
${unverifiedAuthorities.map(item => `- ${item}`).join('\n')}

Rewrite the answer now. Remove every unverified case example, reporter citation, locus classicus claim, public example, or external authority that is not present in the retrieved materials. Do not replace them with new examples. If no verified public example is available from the retrieved materials, say exactly: "No verified public example is available from the current retrieved sources." Keep the answer useful, practical, and end with **In conclusion:**.`;

    return await generateAiAnswer(rewritePrompt, preferredProvider, fallbackProvider, customKeys, customModels);
  } catch (err) {
    console.warn('Rewrite pass failed, returning sanitized first draft:', err?.message || err);
    let sanitizedText = firstDraft.text;
    for (const auth of unverifiedAuthorities) {
      sanitizedText = sanitizedText.split(auth).join('[Unverified reference omitted]');
    }
    return { ...firstDraft, text: sanitizedText };
  }
}

function buildAiResearchBasis(question, provider = 'AI') {
  const source = {
    id: `ai-research-${Date.now()}`,
    category: 'Research Basis',
    section: `${provider} general legal knowledge`,
    title: 'AI-generated legal research basis',
    act: `What Does Nigerian Law Say? / ${provider}`,
    chapter: 'No matched local source',
    part: 'General Nigerian-law response',
    sourcePage: 'No official page retrieved',
    sourceUrl: '',
    isGeneratedBasis: true,
    content: 'No exact official source or verified public example was retrieved from the Nigerian law local law database for this question. This card is not an official citation; it explains that the answer was generated without attaching a verified public example.',
    reasoning: `The question "${cleanString(question, 220)}" did not match a stored Nigerian law public-code source strongly enough, so ${provider} answered from general Nigerian-law knowledge. Unverified case examples should not be used for this answer.`
  };

  return {
    sources: [source],
    reasoning: [{
      id: source.id,
      source: source.section,
      rationale: source.reasoning
    }]
  };
}

// Track page visit (Pinged by client session storage)
app.post('/api/analytics/visit', (req, res) => {
  const { sessionId, user, email, userId, name, path: pagePath, referrer } = req.body || {};
  const userInfo = normalizeUserPayload(user || { email, userId, name });
  const timestamp = Date.now();

  analyticsData.visits.push({
    id: createAnalyticsId('visit'),
    timestamp,
    sessionId: cleanString(sessionId, 120),
    path: cleanString(pagePath || req.body?.pathname || '/', 240),
    email: userInfo.email,
    userId: userInfo.id,
    userName: userInfo.name,
    ip: getClientIp(req),
    userAgent: cleanString(req.headers['user-agent'], 500),
    referer: cleanString(referrer || req.headers.referer || req.headers.referrer, 500),
    origin: cleanString(req.headers.origin, 240)
  });

  if (userInfo.email) {
    upsertRegistration(userInfo, { incrementVisit: true });
  }

  saveAnalytics();
  res.json({ success: true });
});

// Track registered user sign-in
app.post('/api/analytics/register', (req, res) => {
  const { email, userId, name, sessionId } = req.body || {};
  const userInfo = normalizeUserPayload({ email, userId, name });

  if (userInfo.email) {
    const registration = upsertRegistration(userInfo, { incrementVisit: true });
    if (registration) {
      registration.lastSessionId = cleanString(sessionId, 120);
    }
    saveAnalytics();
  }

  res.json({ success: true });
});

// Update client newsletter subscription opt-in
app.post('/api/analytics/subscribe', (req, res) => {
  const { email, userId, name, sessionId, subscribed } = req.body || {};
  const userInfo = normalizeUserPayload({ email, userId, name });

  if (userInfo.email) {
    const registration = upsertRegistration(userInfo, { subscribed: !!subscribed });
    if (registration) {
      registration.lastSessionId = cleanString(sessionId, 120);
      console.log(`🔔 Subscription status updated for ${userInfo.email}: ${registration.subscribed}`);
    }
    saveAnalytics();
  }

  res.json({ success: true });
});

// Fetch all articles
app.get('/api/articles', (req, res) => {
  const list = [...(analyticsData.articles || [])].sort((a, b) => b.timestamp - a.timestamp);
  res.json({ success: true, articles: list });
});

// Deepgram Voice Speech-to-Text Transcription Endpoint
app.post('/api/transcribe', async (req, res) => {
  try {
    const apiKey = normalizeApiKey(req.headers['x-deepgram-key'] || process.env.DEEPGRAM_API_KEY);
    if (!apiKey) {
      return res.status(503).json({
        error: 'Deepgram API key is not configured. Please set DEEPGRAM_API_KEY in server environment settings.'
      });
    }

    let audioBuffer;
    let mimeType = 'audio/webm';

    if (req.body && req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
      if (req.body.mimeType) mimeType = req.body.mimeType;
    } else if (Buffer.isBuffer(req.body)) {
      audioBuffer = req.body;
      if (req.headers['content-type']) mimeType = req.headers['content-type'];
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Audio payload (audioBase64) is required.' });
    }

    const deepgramUrl = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true';
    const dgResponse = await fetch(deepgramUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': mimeType
      },
      body: audioBuffer
    });

    const dgData = await dgResponse.json().catch(() => ({}));

    if (!dgResponse.ok) {
      const errMsg = dgData?.err_msg || dgData?.message || `Deepgram returned status ${dgResponse.status}`;
      return res.status(dgResponse.status).json({ error: errMsg });
    }

    const transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = dgData?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return res.json({
      transcript,
      confidence,
      model: 'nova-2'
    });
  } catch (err) {
    console.error('Deepgram transcription error:', err);
    return res.status(500).json({ error: err.message || 'Transcription failed' });
  }
});

// Chat API Endpoint with Multi-Provider Support and Fallback
app.post('/api/chat', async (req, res) => {
  const {
    message,
    conversationHistory,
    chatId,
    sessionId,
    user,
    aiProvider,
    fallbackProvider,
    customKeys,
    customModels
  } = req.body || {};

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message payload is required.' });
  }

  const cleanMessage = message.trim();
  const normalizedHistory = normalizeConversationHistory(conversationHistory);
  const conversationMemory = buildConversationMemory(cleanMessage, normalizedHistory);
  const searchText = buildSearchText(cleanMessage, normalizedHistory);

  console.log(`💬 User Query: "${cleanMessage}"`);

  // Step 1: Query local database to retrieve matching legal sections
  const localMatch = searchLegalDatabase(searchText);
  const userInfo = normalizeUserPayload(user);
  const sourceCategories = [...new Set((localMatch.sources || [])
    .map(source => normalizeAnalyticsCategory(source.category || source.act || source.title))
    .filter(Boolean))];
  const questionRecord = {
    id: createAnalyticsId('q'),
    text: cleanMessage,
    timestamp: Date.now(),
    category: categorizeQuestion(cleanMessage, localMatch),
    sessionId: cleanString(sessionId, 120),
    chatId: cleanString(chatId, 120),
    email: userInfo.email,
    userId: userInfo.id,
    userName: userInfo.name,
    matchedSourcesCount: (localMatch.sources || []).length,
    sourceCategories
  };

  analyticsData.questions.push(questionRecord);
  updateRegisteredSearchStats(questionRecord);
  saveAnalytics();

  const preferredProvider = normalizeProvider(aiProvider || process.env.AI_PROVIDER || 'auto');
  const safeFallbackProvider = normalizeProvider(fallbackProvider || 'groq');

  const hasSources = localMatch.sources && localMatch.sources.length > 0;
  let systemPrompt;
  let verifiedText;

  if (!hasSources) {
    systemPrompt = `You are What Does Nigerian Law Say?, a smart, highly knowledgeable Nigerian legal information assistant.
The user sent a message or asked a question: "${cleanMessage}".

${conversationMemory}

Respond with sharp legal intelligence, practical clarity, and authority in plain English:
1. Provide a direct, intelligent, and legally insightful answer immediately. Do NOT start with robotic canned introductions like "I am What Does Nigerian Law Say..." or reciting disclaimers.
2. NEVER use em dashes ("—") or en dashes ("–") in your response. Use standard commas, colons, parentheses, or clean sentences instead.
3. Fluently understand Nigerian Pidgin, street phrasing, slang, and real-world Nigerian situations (e.g. questions about "settling police", "bail percentage", "landlord locking door", "arrest without warrant"). Address both the statutory law (e.g. Police Act 2020, Criminal Code / Penal Code, ACJA) and practical realities with astute legal acumen.
4. When organizing your answer, use bold headers (like **Applicable Law:**, **Legal Analysis:**) instead of markdown heading hashes like '###'.
5. Apply this rule in every answer:
${jurisdictionRule}
6. Apply this quotation rule:
${quotationRule}
7. Apply this public examples rule:
${verifiedExamplesRule}
8. When no retrieved exact legal text is available, do not fabricate statutory quotations, chapter numbers, page numbers, years, penalties, case examples, or deadlines.
9. Always end with a short final summary headed exactly **In conclusion:** that directly answers the user's question and gives the safest next step.
10. CRITICAL: Do NOT use robotic phrases such as "Based on the provided context...", "According to the context...", "There is no information in the context...", "The database does not contain...". Be transparent when a supporting source or current amendment has not been checked. Explain naturally and smartly as an experienced legal assistant.`;
    verifiedText = '';
  } else {
    const contextText = formatLegalContext(localMatch.sources);

    systemPrompt = `You are What Does Nigerian Law Say?, a smart, highly knowledgeable Nigerian legal information assistant.
Your job is to explain the law to the user with high legal intelligence, clarity, and authority.
You must ground your explanation primarily in the provided Nigerian legal sections below.

Nigerian legal summaries and reading references:
===
${contextText}
===

Current User's Question: "${cleanMessage}"

${conversationMemory}

Instructions:
1. Provide a direct, smart, and thorough answer immediately. Do NOT start with robotic canned introductions like "I am What Does Nigerian Law Say..." or reciting disclaimers.
2. NEVER use em dashes ("—") or en dashes ("–") in your response. Use standard commas, colons, parentheses, or clean sentences instead.
3. Fluently understand Nigerian Pidgin, street phrasing, and practical Nigerian realities. Address both the statutory law and practical realities with high legal acumen.
4. When organizing your answer, use bold headers (like **What The Law Says:**, **Key Points:**) instead of markdown heading hashes like '###'.
5. Explain how these specific sections apply to the user's question.
6. Apply this quotation rule:
${quotationRule}
7. Apply this public examples rule:
${verifiedExamplesRule}
8. Apply this rule in every answer:
${jurisdictionRule}
9. If the provided legal sections do not fully cover the answer, you may supplement it with general Nigerian legal principles, but do not add public examples or case names unless verified from the retrieved materials.
10. Do not invent procedural dates, waiting periods, filing deadlines, penalties, case examples, court requirements, or locus classicus claims unless they are present in the provided sources. If a detail is not in the sources, say that the user should confirm it from the court record or current rules.
11. Always end with a short final summary headed exactly **In conclusion:** that directly answers the user's question and gives the safest next step.
12. CRITICAL: Do NOT use robotic phrases such as "Based on the provided context...", "According to the context...", "There is no information in the context...", "The database does not contain...". Be transparent when a supporting source or current amendment has not been checked. Explain naturally and smartly as an experienced legal assistant.`;
    verifiedText = contextText;
  }

  try {
    const generated = await generateVerifiedAiAnswer(systemPrompt, verifiedText, preferredProvider, safeFallbackProvider, customKeys, customModels);
    const providerLabel = generated.provider ? generated.provider.toUpperCase() : 'AI';
    const researchBasis = hasSources ? null : buildAiResearchBasis(cleanMessage, providerLabel);
    const cleanAnswer = sanitizeResponseText(generated.text);

    return res.json({
      answerText: cleanAnswer,
      sources: hasSources ? localMatch.sources : researchBasis.sources,
      reasoning: hasSources ? localMatch.reasoning : researchBasis.reasoning,
      engine: generated.provider || 'ai',
      provider: generated.provider || 'ai',
      model: generated.model,
      fallbackUsed: !!generated.fallbackUsed,
      primaryProvider: generated.primaryProvider,
      requestedProvider: preferredProvider
    });
  } catch (err) {
    console.error('❌ AI generation failed across all providers:', err.message);
    const publicError = getPublicGeminiError(err);
    return res.status(publicError.status).json({
      error: publicError.message,
      code: publicError.code,
      engine: preferredProvider
    });
  }
});

registerAdminRoutes(app, { analyticsData, saveAnalytics, ensureAnalyticsShape, cleanString, buildSearchGroups, categorizeQuestion, normalizeProvider, isConfigured, DEFAULT_GEMINI_MODEL, DEFAULT_GROQ_MODEL, DEFAULT_OPENAI_MODEL });

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 What Does Nigerian Law Say? Backend Server running at http://localhost:${PORT}`);
  console.log(`👉 API Endpoint: http://localhost:${PORT}/api/chat`);
});
