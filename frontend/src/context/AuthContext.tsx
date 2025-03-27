import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface GoogleUser {
  iss?: string;
  nbf?: number;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  azp?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (userData: AuthUser) => void;
  loginWithGoogle: (credentialResponse: any) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// You would need to get a real client ID from the Google Cloud Console
// https://console.cloud.google.com/
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Convert Firebase user to our AuthUser format
  const formatUser = (firebaseUser: FirebaseUser): AuthUser => {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      picture: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=0D8ABC&color=fff`
    };
  };

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        // User is signed in
        setUser(formatUser(firebaseUser));
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const loginWithGoogle = async (credentialResponse: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Clear any previous errors
      setAuthError(null);
      
      const decodedUser = jwtDecode<GoogleUser>(credentialResponse.credential);
      
      if (decodedUser && decodedUser.email && decodedUser.name && decodedUser.sub) {
        // Check if email domain is turing.com
        if (!decodedUser.email.endsWith('@turing.com')) {
          const errorMsg = 'Only @turing.com email addresses are allowed';
          console.error('Authentication failed:', errorMsg);
          setAuthError(errorMsg);
          return false;
        }
        
        // Create Google credential
        const credential = GoogleAuthProvider.credential(credentialResponse.credential);
        
        // Sign in with credential
        const result = await signInWithCredential(auth, credential);
        
        if (result.user) {
          // If the user doesn't have a display name or photo, update profile
          if (!result.user.displayName || !result.user.photoURL) {
            await updateProfile(result.user, {
              displayName: decodedUser.name,
              photoURL: decodedUser.picture
            });
          }
          
          // User will be set by the auth state listener
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login function
  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Clear any previous errors
      setAuthError(null);
      
      // Check if email domain is turing.com
      if (!email.endsWith('@turing.com')) {
        const errorMsg = 'Only @turing.com email addresses are allowed';
        console.error('Authentication failed:', errorMsg);
        setAuthError(errorMsg);
        return false;
      }
      
      await signInWithEmailAndPassword(auth, email, password);
      // User will be set by the auth state listener
      return true;
    } catch (error: any) {
      console.error('Error during email login:', error);
      setAuthError(error.message || 'Failed to log in with email and password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Email/password registration function
  const registerWithEmail = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Clear any previous errors
      setAuthError(null);
      
      // Check if email domain is turing.com
      if (!email.endsWith('@turing.com')) {
        const errorMsg = 'Only @turing.com email addresses are allowed';
        console.error('Registration failed:', errorMsg);
        setAuthError(errorMsg);
        return false;
      }
      
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with name and default avatar
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`
      });
      
      // User will be set by the auth state listener
      return true;
    } catch (error: any) {
      console.error('Error during registration:', error);
      setAuthError(error.message || 'Failed to register with email and password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // User will be set to null by the auth state listener
      setAuthError(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading,
        authError,
        login, 
        loginWithGoogle, 
        loginWithEmail,
        registerWithEmail,
        logout,
        clearAuthError
      }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
