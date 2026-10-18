/* global process */
// Rate limiting and usage quota management for free AI providers (Groq and Gemini)
// Also enforces maximum 10 saved conversations per account.

export const DEFAULT_RATE_LIMIT_PER_MINUTE = 5;
export const DEFAULT_DAILY_LIMIT = 20;
export const MAX_SAVED_CONVERSATIONS = 10;

/**
 * Extracts a unique client identifier based on authenticated user, session ID, or IP address.
 */
export function extractClientIdentifier(req, user, sessionId) {
  if (user?.id) return `user_${user.id}`;
  if (user?.email) return `email_${user.email}`;
  if (sessionId) return `session_${sessionId}`;

  const headers = req?.headers || {};
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const firstIp = String(forwarded).split(',')[0].trim();
    if (firstIp) return `ip_${firstIp}`;
  }
  const realIp = headers['x-real-ip'];
  if (realIp) return `ip_${String(realIp).trim()}`;
  if (req?.socket?.remoteAddress) {
    return `ip_${req.socket.remoteAddress}`;
  }
  if (req?.ip) {
    return `ip_${req.ip}`;
  }
  return 'anonymous_client';
}

/**
 * Checks if the caller supplied their own custom API keys (exempting them from the shared free quota).
 */
export function hasUserCustomKeys(customKeys) {
  if (!customKeys || typeof customKeys !== 'object') return false;
  return Boolean(
    (customKeys.groqApiKey && customKeys.groqApiKey.trim()) ||
    (customKeys.groqKey && customKeys.groqKey.trim()) ||
    (customKeys.geminiApiKey && customKeys.geminiApiKey.trim()) ||
    (customKeys.geminiKey && customKeys.geminiKey.trim()) ||
    (customKeys.openaiApiKey && customKeys.openaiApiKey.trim()) ||
    (customKeys.openaiKey && customKeys.openaiKey.trim())
  );
}

/**
 * Prunes an array of conversations to at most max (default 10), removing oldest.
 */
export function pruneConversations(chatsList, max = MAX_SAVED_CONVERSATIONS) {
  if (!Array.isArray(chatsList)) return [];
  if (chatsList.length <= max) return chatsList;
  return chatsList.slice(0, max);
}

/**
 * Scans a Web Storage object (localStorage) and prunes any chat key exceeding the max limit.
 */
export function pruneAllStoredChats(storage, max = MAX_SAVED_CONVERSATIONS) {
  if (!storage || typeof storage.length !== 'number') return;
  const chatKeyPattern = /^nigerian_law_(user_chats_.+|guest_chats)$/;
  const keysToPrune = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && chatKeyPattern.test(key)) {
      keysToPrune.push(key);
    }
  }

  for (const key of keysToPrune) {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > max) {
          const pruned = parsed.slice(0, max);
          storage.setItem(key, JSON.stringify(pruned));
        }
      }
    } catch {
      // Ignore unparseable entries
    }
  }
}

export class AiUsageLimiter {
  constructor(options = {}) {
    this.rateLimitPerMinute = Number(
      options.rateLimitPerMinute || (typeof process !== 'undefined' && process.env?.AI_RATE_LIMIT_PER_MINUTE) || DEFAULT_RATE_LIMIT_PER_MINUTE
    );
    this.dailyLimit = Number(
      options.dailyLimit || (typeof process !== 'undefined' && process.env?.AI_DAILY_LIMIT_PER_USER) || DEFAULT_DAILY_LIMIT
    );
    this.usage = new Map();
  }

  getTodayUtc() {
    return new Date().toISOString().slice(0, 10);
  }

  getMsUntilMidnightUtc() {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return Math.max(1000, midnight.getTime() - now.getTime());
  }

  cleanOldEntries() {
    const now = Date.now();
    const today = this.getTodayUtc();

    for (const [key, record] of this.usage.entries()) {
      record.minuteTimestamps = (record.minuteTimestamps || []).filter(ts => ts > now - 60000);
      if (record.dayDate !== today && record.minuteTimestamps.length === 0) {
        this.usage.delete(key);
      }
    }
  }

  checkLimit(clientKey, options = {}) {
    if (options.hasCustomKeys) {
      return {
        allowed: true,
        hasCustomKeys: true,
        dailyRemaining: Infinity,
        minuteRemaining: Infinity
      };
    }

    const key = String(clientKey || 'anonymous').trim();
    const now = Date.now();
    const today = this.getTodayUtc();

    if (!this.usage.has(key)) {
      this.usage.set(key, {
        minuteTimestamps: [],
        dayDate: today,
        dayCount: 0
      });
    }

    const record = this.usage.get(key);

    if (record.dayDate !== today) {
      record.dayDate = today;
      record.dayCount = 0;
    }

    record.minuteTimestamps = (record.minuteTimestamps || []).filter(ts => ts > now - 60000);

    // 1. Check minute burst limit
    if (record.minuteTimestamps.length >= this.rateLimitPerMinute) {
      const oldest = record.minuteTimestamps[0];
      const waitMs = Math.max(1000, 60000 - (now - oldest));
      const retryAfterSeconds = Math.ceil(waitMs / 1000);

      return {
        allowed: false,
        status: 429,
        limitType: 'burst',
        retryAfter: retryAfterSeconds,
        message: `You are asking questions too quickly. To preserve our free AI tier (Groq and Gemini), please wait ${retryAfterSeconds}s before asking your next question.`
      };
    }

    // 2. Check daily limit
    if (record.dayCount >= this.dailyLimit) {
      const retryAfterSeconds = Math.ceil(this.getMsUntilMidnightUtc() / 1000);

      return {
        allowed: false,
        status: 429,
        limitType: 'daily',
        retryAfter: retryAfterSeconds,
        message: `You have reached the daily limit of ${this.dailyLimit} questions on our free AI service. Your quota resets tomorrow at midnight UTC, or you can provide your own API key in AI Settings to continue immediately.`
      };
    }

    record.minuteTimestamps.push(now);
    record.dayCount += 1;

    if (Math.random() < 0.05) {
      this.cleanOldEntries();
    }

    return {
      allowed: true,
      dailyUsed: record.dayCount,
      dailyLimit: this.dailyLimit,
      dailyRemaining: Math.max(0, this.dailyLimit - record.dayCount),
      minuteRemaining: Math.max(0, this.rateLimitPerMinute - record.minuteTimestamps.length)
    };
  }

  reset() {
    this.usage.clear();
  }
}

export const defaultAiLimiter = new AiUsageLimiter();
