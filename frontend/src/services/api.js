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
  getMe: () => {
    return apiCall('/auth/me');
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

export { API_BASE, getCsrfToken, clearCsrfCache };
