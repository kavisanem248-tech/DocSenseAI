/**
 * DocSenseAI Centralized API Configuration & Safe Request Utility
 */

const TOKEN_KEY = 'docsense_token';
const USER_KEY = 'docsense_user';

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
 * Token & Session Management
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {}
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {}
}

/**
 * Generates headers with Authorization Bearer token attached
 */
export function authHeaders(customHeaders = {}) {
  const token = getAuthToken();
  return {
    ...customHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

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
 * Builds a complete authenticated URL with ?token= for direct links/iframes
 * @param {string} path - e.g. '/api/documents/123/file'
 * @returns {string} - URL with attached authentication token
 */
export function authUrl(path = '') {
  const url = apiUrl(path);
  const token = getAuthToken();
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
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
  } catch (readErr) {
    return { error: `Failed to read server response: ${readErr.message}` };
  }

  if (!text || !text.trim()) {
    return response.ok 
      ? { success: true } 
      : { error: `Server returned empty response with HTTP status ${response.status}` };
  }

  // Handle potential HTML error pages from Render/Cloudflare proxy
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) {
    return {
      error: `Server responded with HTML error page (Status ${response.status}). The service might be booting or encountering a gateway issue.`,
      rawHtml: trimmed.slice(0, 300)
    };
  }

  try {
    return JSON.parse(trimmed);
  } catch (parseErr) {
    return {
      error: `Failed to parse response as JSON: ${parseErr.message}`,
      rawSnippet: trimmed.slice(0, 200)
    };
  }
}
