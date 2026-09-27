import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  apiUrl, 
  safeJson, 
  authHeaders, 
  getAuthToken, 
  setAuthToken, 
  getStoredUser, 
  setStoredUser, 
  clearSession 
} from '../api/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  // Validate session against server on startup
  useEffect(() => {
    const verifySession = async () => {
      const existingToken = getAuthToken();
      if (!existingToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: authHeaders()
        });

        if (res.ok) {
          const data = await safeJson(res);
          if (data.user) {
            setUser(data.user);
            setStoredUser(data.user);
          }
        } else {
          // Token is expired or invalid
          clearSession();
          setUser(null);
          setToken('');
        }
      } catch (err) {
        // If server is temporarily unreachable, maintain cached user
        console.warn('Could not verify session with server:', err.message);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(data.error || 'Failed to log in. Please check your credentials.');
    }

    setAuthToken(data.token);
    setStoredUser(data.user);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  const signup = async (name, email, password, confirmPassword) => {
    const res = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account. Please check your inputs.');
    }

    setAuthToken(data.token);
    setStoredUser(data.user);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: authHeaders()
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearSession();
      setUser(null);
      setToken('');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated: Boolean(user && token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
