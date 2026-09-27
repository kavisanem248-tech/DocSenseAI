import { db } from '../db.js';

/**
 * Handles LLM calls across Gemini, OpenAI/Ollama, or Built-in deterministic extraction
 */
export async function callAiModel({ prompt, systemPrompt, temperature = 0.1, jsonMode = false }) {
  const settings = db.getRawSettings();
  const provider = settings.provider || 'gemini';

  // 1. Google Gemini
  if (provider === 'gemini' && settings.geminiApiKey) {
    try {
      const modelName = settings.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.geminiApiKey}`;

      const contents = [];
      if (systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will strictly follow these instructions.' }] });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const body = {
        contents,
        generationConfig: {
          temperature,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text, provider: 'gemini' };
    } catch (err) {
      console.warn('Gemini API call failed, falling back to deterministic engine:', err.message);
      return { success: false, error: err.message, provider: 'gemini' };
    }
  }

  // 2. OpenAI or Compatible (Ollama / LocalAI / Groq)
  if (provider === 'openai' && settings.openaiApiKey) {
    try {
      const baseUrl = settings.openaiBaseUrl || 'https://api.openai.com/v1';
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const body = {
        model: settings.model || 'gpt-4o-mini',
        messages,
        temperature,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      return { success: true, text, provider: 'openai' };
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to deterministic engine:', err.message);
      return { success: false, error: err.message, provider: 'openai' };
    }
  }

  // 3. Built-in Offline Engine indicator
  return {
    success: false,
    noKey: true,
    provider: 'builtin',
    message: 'No external API key configured. Using built-in high-precision analysis engine.'
  };
}
