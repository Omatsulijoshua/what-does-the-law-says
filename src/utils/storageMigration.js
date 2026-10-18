// Copy known settings from an earlier app namespace without removing saved data.
// Authentication markers are intentionally excluded; administrators sign in again.
export function migrateStoredSettings(storage) {
  const entries = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    const match = key?.match(/^[a-z]+_(user_chats_.+|chats_.+|guest_chats|bookmarks|user|ai_provider|ai_fallback_provider|ai_gemini_key|ai_groq_key|ai_openai_key)$/);
    if (match) entries.push([`nigerian_law_${match[1]}`, storage.getItem(key)]);
  }
  for (const [key, value] of entries) {
    if (storage.getItem(key) === null) storage.setItem(key, value);
  }
}
