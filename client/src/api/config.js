/**
 * DocSenseAI Centralized API Configuration & Safe Request Utility
 */

/**
 * Resolves the backend API base URL.
 * 1. Checks import.meta.env.VITE_API_BASE_URL
 * 2. If running in production browser on a remote host (e.g. Render) and VITE_API_BASE_URL is not set:
 *    Defaults safely to 'https://docsenseai-backend.onrender.com'
 * 3. For local development on localhost:
 *    Defaults to '' (relative path, proxied by Vite dev server to http://localhost:5000)
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Fallback for deployed remote environments (e.g. Render)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocal) {
      return 'https://docsenseai-backend.onrender.com';
    }
  }

  // Local development default (relative, proxied by Vite)
  return '';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Builds a complete URL for an API endpoint.
 * @param {string} path - e.g. '/api/documents/upload' or 'api/health'
 * @returns {string} - e.g. 'https://docsenseai-backend.onrender.com/api/documents/upload'
 */
export function apiUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return `${base}${cleanPath}`;
}

/**
 * Safely parses a fetch Response as JSON.
 * Protects against "Unexpected end of JSON input" errors when the server
 * returns HTML error pages (e.g. 502/404) or an empty body.
 *
 * @param {Response} response - Standard fetch Response object
 * @returns {Promise<any>} - Parsed JSON object or an object containing `{ error: string }`
 */
export async function safeJson(response) {
  if (!response) {
    return { error: 'No response received from server.' };
  }

  let text = '';
  try {
    text = await response.text();
  } catch (err) {
    return { error: `Failed to read server response: ${err.message}` };
  }

  if (!text || !text.trim()) {
    return { 
      error: response.ok 
        ? null 
        : `Server returned an empty response (${response.status} ${response.statusText || 'Error'})`
    };
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // If not valid JSON (e.g. HTML proxy error), extract clean text preview
    const cleanSnippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
    return {
      error: cleanSnippet || `Invalid response format from server (${response.status} ${response.statusText || 'Error'})`,
      rawText: text
    };
  }
}
