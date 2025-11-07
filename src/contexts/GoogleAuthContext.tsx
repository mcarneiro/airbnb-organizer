import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleAuthContextType {
  isSignedIn: boolean;
  userEmail: string | null;
  accessToken: string | null;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
  persistAuth: boolean;
  setPersistAuth: (persist: boolean) => void;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

// Helper to get the appropriate storage based on user preference
function getStorage(): Storage {
  const persistAuth = localStorage.getItem('persistAuth') !== 'false'; // Default to true
  return persistAuth ? localStorage : sessionStorage;
}

// Helper to check if auth is persisted
function shouldPersistAuth(): boolean {
  return localStorage.getItem('persistAuth') !== 'false'; // Default to true
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [persistAuth, setPersistAuthState] = useState(shouldPersistAuth);

  // Initialize from appropriate storage and check token expiration
  const [isSignedIn, setIsSignedIn] = useState(() => {
    const storage = getStorage();
    const expiresAt = storage.getItem('googleAuth_expiresAt');

    // Check if token is expired - don't clear storage yet, let useEffect handle it
    if (expiresAt && Date.now() >= parseInt(expiresAt)) {
      return false;
    }

    return storage.getItem('googleAuth_isSignedIn') === 'true';
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    const storage = getStorage();
    const expiresAt = storage.getItem('googleAuth_expiresAt');

    if (expiresAt && Date.now() >= parseInt(expiresAt)) {
      return null;
    }

    return storage.getItem('googleAuth_userEmail');
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const storage = getStorage();
    const expiresAt = storage.getItem('googleAuth_expiresAt');

    if (expiresAt && Date.now() >= parseInt(expiresAt)) {
      return null;
    }

    return storage.getItem('googleAuth_accessToken');
  });
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(() => {
    const storage = getStorage();
    const expiresAt = storage.getItem('googleAuth_expiresAt');

    if (expiresAt && Date.now() >= parseInt(expiresAt)) {
      return null;
    }

    return expiresAt ? parseInt(expiresAt) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  // Check for expired token on mount
  useEffect(() => {
    const storage = getStorage();
    const expiresAt = storage.getItem('googleAuth_expiresAt');
    const wasSignedIn = storage.getItem('googleAuth_isSignedIn') === 'true';

    // If there was an expiration time and it's expired, and user was signed in
    if (expiresAt && Date.now() >= parseInt(expiresAt) && wasSignedIn) {
      // Show session expired notification
      setSessionExpired(true);
      // Clear all auth data
      storage.removeItem('googleAuth_isSignedIn');
      storage.removeItem('googleAuth_userEmail');
      storage.removeItem('googleAuth_accessToken');
      storage.removeItem('googleAuth_expiresAt');
    }
  }, []); // Run once on mount

  // Function to set persist auth preference
  const setPersistAuth = (persist: boolean) => {
    localStorage.setItem('persistAuth', persist.toString());
    setPersistAuthState(persist);

    // Get expiration time from current storage
    const currentStorage = getStorage();
    const expiresAt = currentStorage.getItem('googleAuth_expiresAt');

    // If switching to session-only, migrate data from localStorage to sessionStorage
    if (!persist) {
      if (isSignedIn) {
        sessionStorage.setItem('googleAuth_isSignedIn', 'true');
        sessionStorage.setItem('googleAuth_userEmail', userEmail || '');
        sessionStorage.setItem('googleAuth_accessToken', accessToken || '');
        if (expiresAt) sessionStorage.setItem('googleAuth_expiresAt', expiresAt);
      }
      localStorage.removeItem('googleAuth_isSignedIn');
      localStorage.removeItem('googleAuth_userEmail');
      localStorage.removeItem('googleAuth_accessToken');
      localStorage.removeItem('googleAuth_expiresAt');
    }
    // If switching to persistent, migrate from sessionStorage to localStorage
    else {
      if (isSignedIn) {
        localStorage.setItem('googleAuth_isSignedIn', 'true');
        localStorage.setItem('googleAuth_userEmail', userEmail || '');
        localStorage.setItem('googleAuth_accessToken', accessToken || '');
        if (expiresAt) localStorage.setItem('googleAuth_expiresAt', expiresAt);
      }
      sessionStorage.removeItem('googleAuth_isSignedIn');
      sessionStorage.removeItem('googleAuth_userEmail');
      sessionStorage.removeItem('googleAuth_accessToken');
      sessionStorage.removeItem('googleAuth_expiresAt');
    }
  };

  // Persist auth state to appropriate storage
  useEffect(() => {
    const storage = getStorage();

    // Update isSignedIn
    if (isSignedIn) {
      storage.setItem('googleAuth_isSignedIn', 'true');
    } else {
      storage.removeItem('googleAuth_isSignedIn');
    }

    // Update userEmail
    if (userEmail) {
      storage.setItem('googleAuth_userEmail', userEmail);
    } else {
      storage.removeItem('googleAuth_userEmail');
    }

    // Update accessToken
    if (accessToken) {
      storage.setItem('googleAuth_accessToken', accessToken);
    } else {
      storage.removeItem('googleAuth_accessToken');
    }

    // Update token expiration
    if (tokenExpiresAt) {
      storage.setItem('googleAuth_expiresAt', tokenExpiresAt.toString());
    } else {
      storage.removeItem('googleAuth_expiresAt');
    }
  }, [isSignedIn, userEmail, accessToken, tokenExpiresAt]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setAccessToken(tokenResponse.access_token);

        // Calculate token expiration time (Google provides expires_in in seconds)
        const expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour
        const expiresAt = Date.now() + (expiresIn * 1000); // Convert to milliseconds
        setTokenExpiresAt(expiresAt);

        // Fetch user info to get email
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const userInfo = await userInfoResponse.json();
        setUserEmail(userInfo.email);
        setIsSignedIn(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user info');
        setIsSignedIn(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Failed to sign in with Google. Please try again.');
      setIsSignedIn(false);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  });

  const signIn = () => {
    login();
  };

  const signOut = (reason?: 'expired') => {
    setIsSignedIn(false);
    setUserEmail(null);
    setAccessToken(null);
    setTokenExpiresAt(null);
    setError(null);

    // Set sessionExpired flag if it's due to expiration
    if (reason === 'expired') {
      setSessionExpired(true);
    }

    // Clear from both storages to ensure complete logout
    localStorage.removeItem('googleAuth_isSignedIn');
    localStorage.removeItem('googleAuth_userEmail');
    localStorage.removeItem('googleAuth_accessToken');
    localStorage.removeItem('googleAuth_expiresAt');
    sessionStorage.removeItem('googleAuth_isSignedIn');
    sessionStorage.removeItem('googleAuth_userEmail');
    sessionStorage.removeItem('googleAuth_accessToken');
    sessionStorage.removeItem('googleAuth_expiresAt');
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        isSignedIn,
        userEmail,
        accessToken,
        error,
        signIn,
        signOut,
        persistAuth,
        setPersistAuth,
        sessionExpired,
        clearSessionExpired,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}
