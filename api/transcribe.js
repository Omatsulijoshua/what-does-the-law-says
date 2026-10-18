/* global process, Buffer */

function normalizeApiKey(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '').trim();
}

function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-deepgram-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const apiKey = normalizeApiKey(req.headers['x-deepgram-key'] || process.env.DEEPGRAM_API_KEY);
    if (!apiKey) {
      return res.status(503).json({
        error: 'Deepgram API key is not configured. Please set DEEPGRAM_API_KEY in environment variables.'
      });
    }

    const body = parseRequestBody(req);
    let audioBuffer;
    let mimeType = 'audio/webm';

    if (body.audioBase64) {
      audioBuffer = Buffer.from(body.audioBase64, 'base64');
      if (body.mimeType) mimeType = body.mimeType;
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
      const errMsg = dgData?.err_msg || dgData?.message || `Deepgram returned HTTP ${dgResponse.status}`;
      return res.status(dgResponse.status).json({ error: errMsg });
    }

    const transcript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = dgData?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return res.status(200).json({
      transcript,
      confidence,
      model: 'nova-2'
    });
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    return res.status(500).json({ error: error.message || 'Internal transcription error' });
  }
}
