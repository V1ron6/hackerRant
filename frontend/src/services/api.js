/**
 * API Service Layer
 * Handles all HTTP requests to the backend API with CSRF support
 */

const configuredApiBase = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL;
const API_BASE = (configuredApiBase || 'http://localhost:4000/api').replace(/\/+$/, '');

let csrfToken = null;

/**
 * Get CSRF token from cookies
 */
const getCsrfToken = () => {
  if (csrfToken) return csrfToken;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; hr_csrf=`);
  if (parts.length === 2) {
    csrfToken = parts.pop().split(';').shift();
    return csrfToken;
  }
  return null;
};

/**
 * Store the CSRF token returned by GET /auth/me. The hr_csrf cookie is set by
 * the API origin, so JS on a different frontend origin (Vercel) can't read it.
 */
const setCsrfToken = (token) => {
  csrfToken = token || null;
};

/**
 * Clear cached CSRF token (after logout or error)
 */
const clearCsrfCache = () => {
  csrfToken = null;
};

/**
 * Make API request with proper headers and error handling
 */
const apiCall = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    skipCsrf = false,
  } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add CSRF token for mutations
  if (!skipCsrf && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      headers['x-csrf-token'] = token;
    }
  }

  const config = {
    method,
    headers,
    credentials: 'include', // Include cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw { status: 0, error: 'Unable to reach the server. Check the connection and API URL, then try again.' };
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // CSRF tokens expire after 1h (or rotate when another device calls /auth/me):
    // fetch a fresh one and retry the request once.
    if (
      response.status === 403 &&
      !skipCsrf &&
      !options._retried &&
      typeof data?.error === 'string' &&
      data.error.startsWith('MERLIN')
    ) {
      clearCsrfCache();
      await authService.getMe();
      return apiCall(endpoint, { ...options, _retried: true });
    }

    throw {
      status: response.status,
      ...(data || {}),
    };
  }

  return data;
};

/**
 * ============ AUTH ENDPOINTS ============
 */

export const authService = {
  /**
   * POST /auth/register
   * Register a new user account
   */
  register: (payload) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: payload,
      skipCsrf: true,
    });
  },

  /**
   * POST /auth/verify-otp
   * Verify OTP sent to email
   */
  verifyOtp: (payload) => {
    return apiCall('/auth/verify-otp', {
      method: 'POST',
      body: payload,
      skipCsrf: true,
    });
  },

  /**
   * POST /auth/login
   * Login with email/username and password
   */
  login: (payload) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: payload,
      skipCsrf: true,
    });
  },

  /**
   * POST /auth/logout
   * Logout and revoke session
   */
  logout: () => {
    clearCsrfCache();
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * GET /auth/me
   * Get current authenticated user profile
   */
  getMe: async () => {
    const res = await apiCall('/auth/me');
    if (res?.data?.csrfToken) setCsrfToken(res.data.csrfToken);
    return res;
  },
};

/**
 * ============ USER ENDPOINTS ============
 */

export const userService = {
  /**
   * GET /users/:username
   * Get public user profile
   */
  getProfile: (username) => {
    return apiCall(`/users/${encodeURIComponent(username)}`);
  },

  /**
   * PATCH /users/me
   * Update own profile
   */
  updateProfile: (payload) => {
    return apiCall('/users/me', {
      method: 'PATCH',
      body: payload,
    });
  },
};

/**
 * ============ SESSIONS ENDPOINTS ============
 */

export const sessionService = {
  /**
   * GET /sessions
   * Get all active sessions
   */
  getSessions: () => {
    return apiCall('/sessions');
  },

  /**
   * DELETE /sessions/:id
   * Revoke a specific session
   */
  revokeSession: (sessionId) => {
    return apiCall(`/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * DELETE /sessions
   * Revoke all sessions
   */
  revokeAllSessions: () => {
    clearCsrfCache();
    return apiCall('/sessions', {
      method: 'DELETE',
    });
  },
};

/**
 * ============ CHAT ENDPOINTS ============
 */

export const chatService = {
  /** GET /chats — my chats with last message + unread count */
  list: () => apiCall('/chats'),

  /** POST /chats — start (or fetch the existing) DM with a username */
  create: (username) => apiCall('/chats', { method: 'POST', body: { username } }),

  /** GET /chats/:chatId/messages — newest page; pass `cursor` for older */
  messages: (chatId, { cursor, limit } = {}) => {
    const q = new URLSearchParams();
    if (cursor) q.set('cursor', cursor);
    if (limit) q.set('limit', String(limit));
    const qs = q.toString();
    return apiCall(`/chats/${encodeURIComponent(chatId)}/messages${qs ? `?${qs}` : ''}`);
  },

  /** POST /chats/:chatId/messages — REST fallback when the socket is down */
  send: (chatId, text) =>
    apiCall(`/chats/${encodeURIComponent(chatId)}/messages`, { method: 'POST', body: { text } }),

  /** POST /chats/:chatId/read */
  markRead: (chatId) =>
    apiCall(`/chats/${encodeURIComponent(chatId)}/read`, { method: 'POST', body: {} }),
};

/**
 * Utility to handle API errors
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.error) return error.error;
  if (error?.message) return error.message;
  if (Array.isArray(error?.errors)) {
    return error.errors.map((e) => e.message).join(', ');
  }
  return 'An error occurred. Please try again.';
};

export { API_BASE, getCsrfToken, setCsrfToken, clearCsrfCache };
