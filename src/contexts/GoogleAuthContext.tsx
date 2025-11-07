import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleAuthContextType {
  isSignedIn: boolean;
  userEmail: string | null;
  accessToken: string | null;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('googleAuth_isSignedIn') === 'true';
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('googleAuth_userEmail');
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('googleAuth_accessToken');
  });
  const [error, setError] = useState<string | null>(null);

  // Persist auth state to localStorage
  useEffect(() => {
    if (isSignedIn) {
      localStorage.setItem('googleAuth_isSignedIn', 'true');
    } else {
      localStorage.removeItem('googleAuth_isSignedIn');
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('googleAuth_userEmail', userEmail);
    } else {
      localStorage.removeItem('googleAuth_userEmail');
    }
  }, [userEmail]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('googleAuth_accessToken', accessToken);
    } else {
      localStorage.removeItem('googleAuth_accessToken');
    }
  }, [accessToken]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setAccessToken(tokenResponse.access_token);

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

  const signOut = () => {
    setIsSignedIn(false);
    setUserEmail(null);
    setAccessToken(null);
    setError(null);
    // Clear localStorage
    localStorage.removeItem('googleAuth_isSignedIn');
    localStorage.removeItem('googleAuth_userEmail');
    localStorage.removeItem('googleAuth_accessToken');
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
