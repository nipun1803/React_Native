import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, DEFAULT_API_URL } from '../api/chatApi';

const AuthContext = createContext();

const STORAGE_KEYS = {
  CREDENTIALS: '@chatapp_real_credentials',
  USER_PROFILE: '@chatapp_real_profile',
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_API_URL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  async function bootstrapAuth() {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const storedCreds = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (storedCreds) {
        const { u, p, s } = JSON.parse(storedCreds);
        const resolvedServer = s || DEFAULT_API_URL;
        setUsername(u);
        setPassword(p);
        setServerUrl(resolvedServer);

        try {
          // Attempt profile fetch to verify credentials & auto-provision
          const profile = await getProfile(resolvedServer, u, p);
          setCurrentUser(profile);
          setIsAuthenticated(true);
        } catch (fetchErr) {
          console.warn('Auto-login fetch failed:', fetchErr.message);
          // Still remember username/password in inputs, but require explicit retry/login
          setAuthError(fetchErr.message);
        }
      }
    } catch (e) {
      console.warn('Failed reading stored auth:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function login(newUsername, newPassword, newServerUrl = serverUrl) {
    setIsLoadingAuth(true);
    setAuthError(null);
    const cleanUser = newUsername.trim();
    const cleanPass = newPassword.trim();
    const cleanUrl = (newServerUrl || DEFAULT_API_URL).trim().replace(/\/+$/, '');

    try {
      // Calling /user/profile with Basic auth verifies credentials & automatically creates the user if they do not exist
      const profile = await getProfile(cleanUrl, cleanUser, cleanPass);

      setUsername(cleanUser);
      setPassword(cleanPass);
      setServerUrl(cleanUrl);
      setCurrentUser(profile);
      setIsAuthenticated(true);

      await AsyncStorage.setItem(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify({ u: cleanUser, p: cleanPass, s: cleanUrl })
      );
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

      return { success: true, profile };
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function logout() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (e) {}
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }

  async function refreshProfile() {
    if (!isAuthenticated || !username || !password) return;
    try {
      const profile = await getProfile(serverUrl, username, password);
      setCurrentUser(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to refresh profile:', e.message);
    }
  }

  const authHeader = `Basic ${username}:${password}`;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        username,
        setUsername,
        password,
        setPassword,
        authHeader,
        serverUrl,
        setServerUrl,
        isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        logout,
        refreshProfile,
      }}
    >
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
