import { getApiEndpoint, fetchWithTimeout } from './api.js';

let activeMediaRecorder = null;
let activeStream = null;
let activeAudioChunks = [];

/**
 * Checks whether audio recording is supported by the user's browser.
 */
export function isAudioRecordingSupported() {
  return typeof window !== 'undefined' &&
    Boolean(navigator?.mediaDevices?.getUserMedia) &&
    Boolean(window.MediaRecorder);
}

/**
 * Checks whether speech synthesis (Text-to-Speech) is supported.
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Pick the best supported audio mime type for MediaRecorder.
 */
function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac'
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return 'audio/webm';
}

/**
 * Starts recording audio from the microphone.
 */
export async function startAudioRecording() {
  if (!isAudioRecordingSupported()) {
    throw new Error('Microphone audio recording is not supported in this browser.');
  }

  // Stop any previous recording
  cancelAudioRecording();

  activeAudioChunks = [];
  activeStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  const mimeType = getSupportedMimeType();
  activeMediaRecorder = new MediaRecorder(activeStream, { mimeType });

  activeMediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      activeAudioChunks.push(event.data);
    }
  };

  activeMediaRecorder.start(250); // Emit chunks every 250ms
  return { mimeType };
}

/**
 * Cancels and cleans up the active recording without saving.
 */
export function cancelAudioRecording() {
  if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
    try {
      activeMediaRecorder.stop();
    } catch {
      // Ignore cleanup error
    }
  }
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  activeMediaRecorder = null;
  activeAudioChunks = [];
}

/**
 * Helper to convert Blob to Base64 string.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Stops recording, sends audio to Deepgram STT endpoint, and returns the transcript.
 */
export async function stopAudioRecordingAndTranscribe() {
  if (!activeMediaRecorder) {
    throw new Error('No active recording session found.');
  }

  const mimeType = activeMediaRecorder.mimeType || 'audio/webm';

  return new Promise((resolve, reject) => {
    activeMediaRecorder.onstop = async () => {
      try {
        const audioBlob = new Blob(activeAudioChunks, { type: mimeType });

        // Clean up stream tracks
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
          activeStream = null;
        }
        activeMediaRecorder = null;
        activeAudioChunks = [];

        if (audioBlob.size < 100) {
          throw new Error('No audio was captured. Please try speaking again.');
        }

        const audioBase64 = await blobToBase64(audioBlob);

        const endpoint = getApiEndpoint('/api/transcribe');
        const customDeepgramKey = localStorage.getItem('nigerian_law_deepgram_key') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (customDeepgramKey) {
          headers['x-deepgram-key'] = customDeepgramKey;
        }

        const response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            audioBase64,
            mimeType
          })
        }, 30000);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `Transcription failed with status ${response.status}`);
        }

        resolve({
          transcript: data.transcript || '',
          confidence: data.confidence || 0,
          model: data.model || 'nova-2'
        });
      } catch (err) {
        reject(err);
      }
    };

    try {
      activeMediaRecorder.stop();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Text-to-Speech: Read legal explanation out loud using SpeechSynthesis.
 */
let currentSpeechUtterance = null;

export function speakText(text, onStart = () => {}, onEnd = () => {}) {
  if (!isSpeechSynthesisSupported()) return;

  stopSpeaking();

  // Strip Markdown characters and URLs for clean speech
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`>•\-*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  currentSpeechUtterance = utterance;

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Prefer English voices
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online')));
  if (enVoice) {
    utterance.voice = enVoice;
  }

  utterance.onstart = onStart;
  utterance.onend = () => {
    currentSpeechUtterance = null;
    onEnd();
  };
  utterance.onerror = () => {
    currentSpeechUtterance = null;
    onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentSpeechUtterance = null;
  }
}

export function isSpeaking() {
  return isSpeechSynthesisSupported() && Boolean(currentSpeechUtterance || window.speechSynthesis.speaking);
}
