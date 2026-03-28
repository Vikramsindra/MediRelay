import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput } from '../components/Inputs';
import { PrimaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';
import { setState } from '../store';
import { loginUser, signupUser } from '../api/auth';
import { saveAuthSession } from '../storage/authStorage';

const STEPS = { LOGIN: 'LOGIN', SIGNUP: 'SIGNUP', PROFILE: 'PROFILE' };

export default function AuthScreen({ onAuth }) {
  const [step, setStep] = useState(STEPS.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [hospital, setHospital] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

  const canSubmitLogin = isEmailValid(email) && password.length >= 6;
  const canSubmitSignup = isEmailValid(email) && password.length >= 6 && confirmPassword.length >= 6;

  const resetAuthForm = () => {
    setAuthError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignup = () => {
    if (!canSubmitSignup) return;
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    setPendingAuth({ email: normalizeEmail(email), password });
    setAuthError('');
    setStep(STEPS.PROFILE);
  };

  const handleLogin = async () => {
    if (!canSubmitLogin) return;
    try {
      setLoading(true);
      setAuthError('');
      const authUser = await loginUser({ email: normalizeEmail(email), password });

      if (!authUser?.userId) {
        throw new Error('Missing userId from server');
      }

      await saveAuthSession({
        userId: authUser.userId,
        email: authUser.email,
        name: authUser.name,
        hospitalName: authUser.hospitalName,
      });

      setState((s) => ({
        ...s,
        doctor: {
          ...s.doctor,
          userId: authUser.userId,
          email: authUser.email,
          name: authUser.name || s.doctor?.name || '',
          hospital: authUser.hospitalName || s.doctor?.hospital || '',
          isLoggedIn: true,
        },
      }));

      onAuth?.();
    } catch (error) {
      setAuthError(error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name || !hospital) return;
    if (!pendingAuth?.email || !pendingAuth?.password) {
      setAuthError('Please complete signup details first');
      setStep(STEPS.SIGNUP);
      return;
    }

    try {
      setLoading(true);
      setAuthError('');

      const authUser = await signupUser({
        name,
        email: pendingAuth.email,
        hospitalName: hospital,
        password: pendingAuth.password,
      });

      if (!authUser?.userId) {
        throw new Error('Missing userId from server');
      }

      await saveAuthSession({
        userId: authUser.userId,
        email: authUser.email,
        name: authUser.name || name,
        hospitalName: authUser.hospitalName || hospital,
      });

      setState((s) => ({
        ...s,
        doctor: {
          ...s.doctor,
          userId: authUser.userId,
          name: authUser.name || name,
          hospital: authUser.hospitalName || hospital,
          role,
          email: authUser.email,
          isLoggedIn: true,
        },
      }));

      onAuth?.();
    } catch (error) {
      setAuthError(error?.message || 'Signup failed');
      setStep(STEPS.SIGNUP);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAuthError('');
  }, [step]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <AppIcon name="check" size={28} color={colors.primary} />
            </View>
            <Text style={[typography.displayMd, { color: colors.primary, marginTop: spacing[4] }]}>
              MediRelay
            </Text>
            <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[1.5] }]}>
              Safe handoffs. Every time.
            </Text>
          </View>

          {/* Step: Login */}
          {step === STEPS.LOGIN && (
            <View style={styles.card}>
              <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}>
                Login with email
              </Text>
              <LabeledInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="doctor@hospital.com"
                keyboardType="email-address"
                required
                autoFocus
              />
              <LabeledInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                secureTextEntry={!showLoginPassword}
                required
              />
              <TouchableOpacity onPress={() => setShowLoginPassword((v) => !v)} style={styles.passwordToggleBtn}>
                <Text style={[typography.bodySm, { color: colors.primary }]}>
                  {showLoginPassword ? 'Hide password' : 'Show password'}
                </Text>
              </TouchableOpacity>
              {authError ? (
                <Text style={[typography.bodySm, { color: colors.error, marginBottom: spacing[4] }]}>{authError}</Text>
              ) : null}
              <PrimaryButton
                label="Login"
                onPress={handleLogin}
                disabled={!canSubmitLogin}
                loading={loading}
              />
              <TouchableOpacity
                onPress={() => {
                  resetAuthForm();
                  setStep(STEPS.SIGNUP);
                }}
                style={styles.authSwitchBtn}
              >
                <Text style={[typography.bodySm, { color: colors.primary }]}>New here? Create account</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Sign Up */}
          {step === STEPS.SIGNUP && (
            <View style={styles.card}>
              <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}> 
                Sign up with email
              </Text>
              <LabeledInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="doctor@hospital.com"
                keyboardType="email-address"
                required
                autoFocus
              />
              <LabeledInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                secureTextEntry={!showSignupPassword}
                required
              />
              <TouchableOpacity onPress={() => setShowSignupPassword((v) => !v)} style={styles.passwordToggleBtn}>
                <Text style={[typography.bodySm, { color: colors.primary }]}>
                  {showSignupPassword ? 'Hide password' : 'Show password'}
                </Text>
              </TouchableOpacity>
              <LabeledInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                secureTextEntry={!showConfirmPassword}
                required
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.passwordToggleBtn}>
                <Text style={[typography.bodySm, { color: colors.primary }]}>
                  {showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                </Text>
              </TouchableOpacity>
              {authError ? (
                <Text style={[typography.bodySm, { color: colors.error, marginBottom: spacing[4] }]}>{authError}</Text>
              ) : null}
              <PrimaryButton
                label="Create Account"
                onPress={handleSignup}
                disabled={!canSubmitSignup}
                loading={loading}
              />
              <TouchableOpacity
                onPress={() => {
                  resetAuthForm();
                  setStep(STEPS.LOGIN);
                }}
                style={styles.authSwitchBtn}
              >
                <View style={styles.changeNumberRow}>
                  <AppIcon name="back" size={14} color={colors.outline} />
                  <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center', marginLeft: spacing[1] }]}>Back to login</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Profile (first login only) */}
          {step === STEPS.PROFILE && (
            <View style={styles.card}>
              <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}>
                Complete your profile
              </Text>
              <LabeledInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Dr. Firstname Lastname"
                required
                autoFocus
              />
              {/* Role toggle */}
              <View style={{ marginBottom: spacing[5] }}>
                <Text style={[typography.labelMd, { color: colors.onSurfaceVariant, marginBottom: spacing[2] }]}>
                  Role
                </Text>
                <View style={styles.roleRow}>
                  {['Doctor', 'Nurse'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.roleBtn,
                        role === r
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { borderColor: colors.outlineVariant },
                      ]}
                    >
                      <Text style={[typography.titleSm, { color: role === r ? colors.onPrimary : colors.onSurfaceVariant }]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <LabeledInput
                label="Hospital Name"
                value={hospital}
                onChangeText={setHospital}
                placeholder="e.g. Apollo Hospital"
                required
              />
              <PrimaryButton
                label="Get Started"
                onPress={handleSaveProfile}
                disabled={!name || !hospital}
              />
            </View>
          )}

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
    padding: spacing[6],
    justifyContent: 'center',
  },
  logoBlock: { alignItems: 'center', marginBottom: spacing[8] },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeNumberRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing[6],
  },
  passwordToggleBtn: {
    alignSelf: 'flex-end',
    marginTop: -spacing[3],
    marginBottom: spacing[4],
  },
  authSwitchBtn: { marginTop: spacing[4], alignItems: 'center' },
  roleRow: { flexDirection: 'row', gap: spacing[3] },
  roleBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
