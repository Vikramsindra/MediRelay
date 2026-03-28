import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput, OTPBoxes } from '../components/Inputs';
import { PrimaryButton } from '../components/Buttons';
import { setState } from '../store';

const STEPS = { PHONE: 'PHONE', OTP: 'OTP', PROFILE: 'PROFILE' };

export default function AuthScreen({ onAuth }) {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [hospital, setHospital] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-submit when OTP is fully entered
  useEffect(() => {
    if (otp.length === 6) handleVerifyOtp();
  }, [otp]);

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(STEPS.OTP);
      setResendTimer(30);
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // First login → ask profile
      setStep(STEPS.PROFILE);
    }, 600);
  };

  const handleSaveProfile = () => {
    if (!name || !hospital) return;
    setState((s) => ({
      ...s,
      doctor: { name, hospital, phone, role, isLoggedIn: true },
    }));
    onAuth?.();
  };

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
              <Text style={styles.logoEmoji}>🏥</Text>
            </View>
            <Text style={[typography.displayMd, { color: colors.primary, marginTop: spacing[4] }]}>
              MediRelay
            </Text>
            <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[1.5] }]}>
              Safe handoffs. Every time.
            </Text>
          </View>

          {/* Step: Phone */}
          {step === STEPS.PHONE && (
            <View style={styles.card}>
              <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}>
                Enter your phone number
              </Text>
              <LabeledInput
                label="Phone Number"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                required
                autoFocus
              />
              <PrimaryButton
                label="Send OTP"
                onPress={handleSendOtp}
                disabled={phone.length < 10}
                loading={loading}
              />
            </View>
          )}

          {/* Step: OTP */}
          {step === STEPS.OTP && (
            <View style={styles.card}>
              <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[2] }]}>
                Enter OTP
              </Text>
              <Text style={[typography.bodySm, { color: colors.outline, marginBottom: spacing[5] }]}>
                Sent to +91 {phone}
              </Text>
              <OTPBoxes value={otp} onChange={setOtp} length={6} />
              <View style={styles.resendRow}>
                {resendTimer > 0 ? (
                  <Text style={[typography.bodySm, { color: colors.outline, marginTop: spacing[5] }]}>
                    Resend in {resendTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => { setOtp(''); setResendTimer(30); }}
                    style={{ marginTop: spacing[5] }}
                  >
                    <Text style={[typography.bodyMd, { color: colors.primary }]}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
              {loading && (
                <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center', marginTop: spacing[4] }]}>
                  Verifying…
                </Text>
              )}
              <TouchableOpacity onPress={() => { setStep(STEPS.PHONE); setOtp(''); }} style={{ marginTop: spacing[4] }}>
                <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center' }]}>
                  ← Change number
                </Text>
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
  logoEmoji: { fontSize: 36 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing[6],
  },
  resendRow: { alignItems: 'center' },
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
