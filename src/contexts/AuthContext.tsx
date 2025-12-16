import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  username: string | null;
  userId: string | null;
  sessionToken: string | null;
  login: (userId: string, username: string, token: string) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (storedToken) {
      validateStoredSession(storedToken);
    } else {
      setIsValidating(false);
    }
  }, []);

  const validateStoredSession = async (token: string) => {
    try {
      const { data, error } = await supabase
        .rpc('validate_session', { input_token: token });

      if (error || !data || data.length === 0) {
        // Invalid session, clear storage
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setSessionToken(null);
        setUsername(null);
        setUserId(null);
      } else {
        // Valid session
        const sessionData = data[0];
        setSessionToken(token);
        setUsername(sessionData.username);
        setUserId(sessionData.user_id);
      }
    } catch (error) {
      console.error('Session validation error');
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } finally {
      setIsValidating(false);
    }
  };

  const validateSession = async (): Promise<boolean> => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    try {
      const { data, error } = await supabase.rpc('validate_session', { input_token: token });

      if (error || !data || data.length === 0) {
        // Invalid session
        await logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const login = (newUserId: string, newUsername: string, token: string) => {
    setUserId(newUserId);
    setUsername(newUsername);
    setSessionToken(token);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  };

  const logout = async () => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (token) {
      try {
        // Delete session from server
        await supabase.rpc('delete_user_session', { input_token: token });
      } catch (error) {
        console.error('Logout error');
      }
    }

    setUserId(null);
    setUsername(null);
    setSessionToken(null);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  };

  // Don't render children until initial validation is complete
  if (isValidating) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      username, 
      userId,
      sessionToken,
      login, 
      logout, 
      isAuthenticated: !!sessionToken && !!username,
      validateSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
