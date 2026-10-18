/* global process */
// Admin API handlers are mounted only by the Express backend.
export function registerAdminRoutes(app, { analyticsData, saveAnalytics, ensureAnalyticsShape, cleanString, buildSearchGroups, categorizeQuestion, normalizeProvider, isConfigured, DEFAULT_GEMINI_MODEL, DEFAULT_GROQ_MODEL, DEFAULT_OPENAI_MODEL }) {
// Publish Article & Simulate Email Dispatch Endpoint
app.post('/api/admin/publish-article', (req, res) => {
  const { email, password, title, subtitle, thumbnail, content, audience } = req.body;

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and Content are required.' });
    }

    // Create article object
    const newArticle = {
      id: `art_${Date.now()}`,
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      thumbnail: thumbnail || 'scale',
      content: content.trim(),
      audience: audience || 'all',
      timestamp: Date.now()
    };

    if (!analyticsData.articles) {
      analyticsData.articles = [];
    }
    analyticsData.articles.push(newArticle);
    saveAnalytics();

    // Determine recipient emails
    const targetEmails = audience === 'all'
      ? analyticsData.registrations.map(r => r.email)
      : analyticsData.registrations
          .filter(r => r.subscribed === true)
          .map(r => r.email);

    // Deduplicate emails
    const uniqueRecipients = [...new Set(targetEmails.map(e => e.toLowerCase()))];

    // Log the simulation of SMTP dispatching
    console.log(`\n📧 ===== EMAIL DISPATCH SIMULATION START =====`);
    console.log(`📝 Newsletter Article: "${title}"`);
    console.log(`👥 Target Group Filter: ${audience === 'all' ? 'All Registered Clients' : 'Subscribed Clients Only'}`);
    console.log(`✉️ Dispatching to ${uniqueRecipients.length} client email(s)...`);
    
    uniqueRecipients.forEach(emailAddr => {
      console.log(`   👉 [DISPATCHED] To: ${emailAddr} | Subject: [What Does Nigerian Law Say?] ${title}`);
    });
    console.log(`📧 ===== EMAIL DISPATCH SIMULATION COMPLETE =====\n`);

    return res.json({
      success: true,
      article: newArticle,
      recipientsCount: uniqueRecipients.length
    });
  } else {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

// Admin Login & Stats Calculator Endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Calculate views over dynamic timeframes
    const visitsToday = analyticsData.visits.filter(v => v.timestamp > now - oneDay).length;
    const visitsThisWeek = analyticsData.visits.filter(v => v.timestamp > now - 7 * oneDay).length;
    const visitsThisMonth = analyticsData.visits.filter(v => v.timestamp > now - 30 * oneDay).length;

    ensureAnalyticsShape();

    // Registered clients
    const registrations = [...analyticsData.registrations].sort((a, b) => b.lastSeen - a.lastSeen);
    const registeredCount = new Set(registrations.map(r => r.email)).size;
    const questions = [...analyticsData.questions].sort((a, b) => b.timestamp - a.timestamp);
    const searchGroups = buildSearchGroups(questions);
    const totalSearches = questions.length;

    // Top questions count
    const questionCounts = {};
    questions.forEach(q => {
      const txt = cleanString(q.text, 1200);
      if (txt) {
        if (!questionCounts[txt]) {
          questionCounts[txt] = {
            text: txt,
            count: 0,
            category: q.category || categorizeQuestion(txt),
            latestAt: q.timestamp
          };
        }
        questionCounts[txt].count += 1;
        questionCounts[txt].latestAt = Math.max(questionCounts[txt].latestAt, q.timestamp);
      }
    });

    const topQuestions = Object.values(questionCounts)
      .sort((a, b) => b.count - a.count || b.latestAt - a.latestAt)
      .slice(0, 15); // Show top 15 questions
    const recentSearches = questions.slice(0, 50);

    // Historical articles list
    const articles = [...(analyticsData.articles || [])].sort((a, b) => b.timestamp - a.timestamp);

    return res.json({
      success: true,
      stats: {
        registeredCount,
        visitsToday,
        visitsThisWeek,
        visitsThisMonth,
        totalSearches,
        searchGroups,
        recentSearches,
        topQuestions,
        registrations: registrations.slice(0, 30), // Return last 30 registration activities
        articles: articles // History of published updates
      }
    });
  } else {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

// Admin AI Settings & Diagnostics Endpoint
app.get('/api/admin/ai-settings', (req, res) => {
  res.json({
    success: true,
    aiProvider: process.env.AI_PROVIDER || 'auto',
    geminiConfigured: isConfigured(process.env.GEMINI_API_KEY),
    groqConfigured: isConfigured(process.env.GROQ_API_KEY),
    openaiConfigured: isConfigured(process.env.OPENAI_API_KEY),
    models: {
      gemini: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      groq: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      openai: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
    }
  });
});

app.post('/api/admin/ai-settings', (req, res) => {
  const { email, password, aiProvider, geminiApiKey, groqApiKey, openaiApiKey } = req.body || {};

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    if (aiProvider) {
      process.env.AI_PROVIDER = normalizeProvider(aiProvider);
    }
    if (typeof geminiApiKey === 'string' && geminiApiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }
    if (typeof groqApiKey === 'string' && groqApiKey.trim()) {
      process.env.GROQ_API_KEY = groqApiKey.trim();
    }
    if (typeof openaiApiKey === 'string' && openaiApiKey.trim()) {
      process.env.OPENAI_API_KEY = openaiApiKey.trim();
    }

    return res.json({
      success: true,
      message: 'Server AI settings updated successfully.',
      aiProvider: process.env.AI_PROVIDER || 'auto',
      geminiConfigured: isConfigured(process.env.GEMINI_API_KEY),
      groqConfigured: isConfigured(process.env.GROQ_API_KEY),
      openaiConfigured: isConfigured(process.env.OPENAI_API_KEY)
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials.' });
});


}
