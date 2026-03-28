import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { setState, getState } from '../store';

const MODES = { LOGIN: 'LOGIN', SIGNUP: 'SIGNUP' };

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState(MODES.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);

  const showError = (text) => {
    setMessage(text);
    setMessageType('error');
  };

  const showSuccess = (text) => {
    setMessage(text);
    setMessageType('success');
  };

  const handleSignup = () => {
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    setTimeout(() => {
      setState((s) => ({
        ...s,
        authUsers: [...(s.authUsers ?? []), { email: normalizedEmail, password }],
      }));

      setLoading(false);
      setPassword('');
      setConfirmPassword('');
      setMode(MODES.LOGIN);
      showSuccess('Signup successful. Please login. (Validation skipped)');
    }, 500);
  };

  const handleLogin = () => {
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    const derivedName = (normalizedEmail || 'doctor')
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

    setLoading(true);
    setTimeout(() => {
      setState((s) => ({
        ...s,
        doctor: {
          ...(s.doctor ?? {}),
          name: s.doctor?.name || derivedName || 'Doctor',
          hospital: s.doctor?.hospital || 'Not set',
          phone: normalizedEmail || 'guest@medirelay.local',
          email: normalizedEmail || 'guest@medirelay.local',
          role: s.doctor?.role || 'Doctor',
          isLoggedIn: true,
        },
      }));
      setLoading(false);
      onAuth?.();
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBlock}>
            <Text style={styles.brand}>MediRelay</Text>
            <Text style={styles.tagline}>Secure clinical handoffs</Text>
          </View>

          <View style={[styles.card, shadow.md]}>
            <Text style={styles.title}>{mode === MODES.LOGIN ? 'Login' : 'Sign Up'}</Text>
            <Text style={styles.subtitle}>
              {mode === MODES.LOGIN
                ? 'Enter your email and password to continue.'
                : 'Create an account with email and password.'}
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="doctor@hospital.com"
              placeholderTextColor={colors.outline}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={colors.outline}
              style={styles.input}
              secureTextEntry
            />

            {mode === MODES.SIGNUP && (
              <>
                <Text style={styles.label}>Re-enter Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.outline}
                  style={styles.input}
                  secureTextEntry
                />
              </>
            )}

            {message ? (
              <Text style={[styles.message, messageType === 'error' ? styles.errorText : styles.successText]}>
                {message}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={mode === MODES.LOGIN ? handleLogin : handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Please wait...' : mode === MODES.LOGIN ? 'Login' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMode(mode === MODES.LOGIN ? MODES.SIGNUP : MODES.LOGIN);
                setPassword('');
                setConfirmPassword('');
                setMessage('');
              }}
              style={styles.switchBtn}
            >
              <Text style={styles.switchBtnText}>
                {mode === MODES.LOGIN
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  logoBlock: { alignItems: 'center', marginBottom: spacing[7] },
  brand: { ...typography.displayMd, color: colors.primary, fontWeight: '800' },
  tagline: { ...typography.bodyMd, color: colors.outline, marginTop: spacing[1] },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing[6],
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodySm, color: colors.outline, marginTop: spacing[1], marginBottom: spacing[5] },
  label: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing[1.5] },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing[3],
    color: colors.onSurface,
    marginBottom: spacing[4],
    fontSize: 16,
  },
  message: { ...typography.bodySm, marginBottom: spacing[3] },
  errorText: { color: colors.error },
  successText: { color: '#1a6640' },
  primaryBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  primaryBtnText: {
    ...typography.titleMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.7 },
  switchBtn: { marginTop: spacing[4], alignItems: 'center' },
  switchBtnText: { ...typography.bodyMd, color: colors.primary },
});
