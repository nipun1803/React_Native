import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';
import { DEFAULT_API_URL } from '../api/chatApi';

export default function LoginScreen() {
  const { login, serverUrl, setServerUrl, authError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false); // false = Sign In, true = Create Account
  const [username, setInputUsername] = useState('');
  const [password, setInputPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hostUrl, setHostUrl] = useState(serverUrl || DEFAULT_API_URL);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async () => {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both your username and password');
      return;
    }

    if (isSignUp) {
      if (cleanPass.length < 4) {
        setErrorMsg('Password should be at least 4 characters');
        return;
      }
      if (cleanPass !== confirmPassword.trim()) {
        setErrorMsg('Passwords do not match');
        return;
      }
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await login(cleanUser, cleanPass, hostUrl.trim());
    } catch (err) {
      setErrorMsg(
        err.message || 'Authentication failed. Please check your credentials or server connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="chatbubbles" size={38} color="#ffffff" />
          </View>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Choose a unique username and password to create your account'
              : 'Sign in to access your conversations and messages'}
          </Text>
        </View>

        {/* Auth Mode Tabs: Sign In / Create Account */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, !isSignUp && styles.tabBtnActive]}
            onPress={() => {
              setIsSignUp(false);
              setErrorMsg(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-in-outline"
              size={17}
              color={!isSignUp ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, isSignUp && styles.tabBtnActive]}
            onPress={() => {
              setIsSignUp(true);
              setErrorMsg(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-add-outline"
              size={16}
              color={isSignUp ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {(errorMsg || authError) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg || authError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {isSignUp ? 'Desired Username' : 'Username'}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={19} color={COLORS.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder={isSignUp ? 'Choose your username' : 'Enter your username'}
                placeholderTextColor={COLORS.textMuted}
                value={username}
                onChangeText={setInputUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {isSignUp ? 'Create Password' : 'Password'}
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={19} color={COLORS.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder={isSignUp ? 'Choose a password' : 'Enter your password'}
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setInputPassword}
                secureTextEntry
              />
            </View>
          </View>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={19} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.serverToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showServerConfig ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.serverToggleText}>
              Backend Server: {hostUrl.replace(/^https?:\/\//, '')}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>API Base URL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="globe-outline" size={19} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="http://10.7.1.51:3000"
                  placeholderTextColor={COLORS.textMuted}
                  value={hostUrl}
                  onChangeText={(val) => {
                    setHostUrl(val);
                    setServerUrl(val);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  {isSignUp ? 'Create My Account' : 'Sign In'}
                </Text>
                <Ionicons
                  name={isSignUp ? 'checkmark-circle' : 'arrow-forward'}
                  size={18}
                  color="#ffffff"
                />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {isSignUp
                ? 'Your new user will be provisioned directly in the backend with the Basic auth credentials you choose.'
                : 'Enter your credentials to connect directly to the NestJS backend.'}
            </Text>
          </View>
        </View>

        {/* Toggle between Sign In and Create Account */}
        <TouchableOpacity
          style={styles.switchModeBtn}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.switchModeText}>
            {isSignUp
              ? 'Already have an account? '
              : "Don't have an account? "}
            <Text style={styles.switchModeHighlight}>
              {isSignUp ? 'Sign In' : 'Create an Account'}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 54,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    paddingVertical: 6,
  },
  serverToggleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    marginTop: 10,
    gap: 8,
    ...SHADOWS.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  switchModeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  switchModeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  switchModeHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
