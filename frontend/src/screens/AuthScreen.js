import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, TextInput,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { OTPBoxes } from '../components/Inputs';
import { AppIcon } from '../components/AppIcon';
import { setState } from '../store';

const SCREENS = {
  ROLE_PICK: 'ROLE_PICK',
  HEALTHCARE_LOGIN: 'HEALTHCARE_LOGIN',
  PATIENT_LOGIN: 'PATIENT_LOGIN',
  HEALTHCARE_SIGNUP_DETAILS: 'HEALTHCARE_SIGNUP_DETAILS',
  OTP_VERIFY: 'OTP_VERIFY',
  SET_PASSWORD: 'SET_PASSWORD',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.108.160:8080';

export default function AuthScreen({ onAuth }) {
  const [screen, setScreen] = useState(SCREENS.ROLE_PICK);
  const [otpFlow, setOtpFlow] = useState('signup'); // signup | patient

  // Shared
  const [role, setRole] = useState('Doctor');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Healthcare sign in
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hospital, setHospital] = useState('');

  // Password setup
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP timers
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpireTimer, setOtpExpireTimer] = useState(120);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('+91');
  const [signupError, setSignupError] = useState('');

  const phoneValid = phone.length >= 6 && phone.length <= 15;
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  const maskedPhone = useMemo(() => {
    const safe = phone || '';
    if (safe.length < 4) return `${callingCode} XXXXX0000`;
    return `${callingCode} XXXXX${safe.slice(-4)}`;
  }, [callingCode, phone]);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (signupPassword.length >= 6) score += 1;
    if (/[A-Z]/.test(signupPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(signupPassword)) score += 1;
    if (!name || !signupPassword.toLowerCase().includes(name.toLowerCase().split(' ')[0])) score += 1;
    return score;
  }, [signupPassword, name]);

  const passwordsMatch = confirmPassword.length > 0 && signupPassword === confirmPassword;
  const isSignupPasswordValid = signupPassword.length >= 6 && passwordsMatch;

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length < 6) return;
    setLoading(true);
    setOtpError('');

    // For signup flow, verify OTP via backend before moving to password
    if (otpFlow === 'signup') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/patient/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `${callingCode}${phone}`, otp }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Invalid OTP');
        }

        setLoading(false);
        setScreen(SCREENS.SET_PASSWORD);
        return;
      } catch (error) {
        setOtpError(error?.message || 'OTP verification failed.');
        setLoading(false);
        return;
      }
    }

    // For patient flow, verify OTP and login
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/patient/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${callingCode}${phone}`, otp }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Invalid OTP');
      }

      setState((s) => ({
        ...s,
        authUserType: 'patient',
        doctor: {
          ...s.doctor,
          name:
            s.doctor?.name && s.doctor.name !== 'Patient User'
              ? s.doctor.name
              : 'Dr. Aris Sharma',
          hospital:
            s.doctor?.hospital && s.doctor.hospital !== 'Patient View'
              ? s.doctor.hospital
              : 'Apollo Hospital',
          phone: `${callingCode}${phone}`,
          role: s.doctor?.role || 'Doctor',
          isLoggedIn: true,
        },
        patientProfile: {
          ...s.patientProfile,
          phone: `${callingCode}${phone}`,
          name: payload?.data?.user?.name || s.patientProfile?.name,
        },
      }));
      onAuth?.('patient');
    } catch (error) {
      setOtpError(error?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }, [otp, otpFlow, callingCode, phone, loading]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    if (screen !== SCREENS.OTP_VERIFY || otpExpireTimer <= 0) return;
    const t = setTimeout(() => setOtpExpireTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, otpExpireTimer]);
  
  // NOTE: Auto-verification removed — user must click "Verify" button
  // This avoids function-not-defined issues and gives user control

  const goToOtp = (flowType) => {
    setOtpFlow(flowType);
    setOtp('');
    setOtpError('');
    setScreen(SCREENS.OTP_VERIFY);
    setResendTimer(30);
    setOtpExpireTimer(120);
  };

  const requestPatientOtp = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/patient/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: `${callingCode}${phone}` }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to send OTP');
    }

    return payload?.data;
  };

  const handleHealthcareSignIn = async () => {
    if (!phoneValid || password.length < 6) return;

    setLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${callingCode}${phone}`, password }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Login failed');
      }

      const user = payload?.data?.user || {};

      setState((s) => ({
        ...s,
        authUserType: 'doctor',
        doctor: {
          ...s.doctor,
          name: user?.name || s.doctor?.name,
          hospital: user?.hospitalName || s.doctor?.hospital,
          phone: user?.phone || `${callingCode}${phone}`,
          role: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : role,
          isLoggedIn: true,
        },
      }));

      onAuth?.('doctor');
    } catch (error) {
      setLoginError(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupNext = async () => {
    if (!name || !emailValid || !hospital || !phoneValid) return;
    setSignupError('');
    setLoading(true);
    try {
      // Send OTP to doctor's phone before moving to OTP screen
      const data = await requestPatientOtp();
      console.log('🔐 Signup OTP data received:', data);
      if (data?.devOtp) {
        console.log('📱 Dev OTP auto-filled:', data.devOtp);
        setOtp(data.devOtp);
      }
      goToOtp('signup');
    } catch (error) {
      console.error('❌ OTP request failed:', error);
      setSignupError(error?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpForPatient = async () => {
    if (!phoneValid) return;
    setLoading(true);
    setOtpError('');
    try {
      const data = await requestPatientOtp();
      console.log('🔐 OTP data received:', data);
      // Auto-fill OTP if devOtp is returned (development mode)
      if (data?.devOtp) {
        console.log('📱 Dev OTP auto-filled:', data.devOtp);
        setOtp(data.devOtp);
      }
      goToOtp('patient');
    } catch (error) {
      console.error('❌ OTP request failed:', error);
      setOtpError(error?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendTimer(30);
    setOtp('');
    setOtpError('');

    if (otpFlow !== 'patient') return;

    try {
      await requestPatientOtp();
    } catch (error) {
      setResendTimer(0);
      setOtpError(error?.message || 'Could not resend OTP.');
    }
  };

  const handleCreateAccount = async () => {
    if (!isSignupPasswordValid) return;

    setLoading(true);
    setSignupError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/staff/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: signupPassword,
          role: role.toLowerCase(),
          hospitalName: hospital.trim(),
          specialization: '',
          phone: `${callingCode}${phone}`,
          otp: otp,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Create account failed');
      }

      const registeredUser = payload?.data?.user || {};

      setState((s) => ({
        ...s,
        authUserType: 'doctor',
        doctor: {
          ...s.doctor,
          name: registeredUser?.name || name,
          hospital: registeredUser?.hospitalName || hospital,
          phone: registeredUser?.phone || `${callingCode}${phone}`,
          role: role,
          isLoggedIn: true,
        },
      }));

      onAuth?.('doctor');
    } catch (error) {
      setSignupError(error?.message || 'Could not create account. Check backend/server and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldValid = {
    healthcareLogin: phoneValid && password.length >= 6,
    signupDetails: !!name && emailValid && !!hospital && phoneValid,
    signupPassword: isSignupPasswordValid,
    patientPhone: phoneValid,
  };

  const handleCountrySelect = (selectedCountry) => {
    setCountryCode(selectedCountry?.cca2 || 'IN');
    const selectedCallingCode = selectedCountry?.callingCode?.[0];
    if (selectedCallingCode) {
      setCallingCode(`+${selectedCallingCode}`);
    }
  };

  const renderPhoneInput = (placeholder = 'Phone number') => (
    <View style={styles.phoneRowBox}>
      <View style={styles.prefixBox}>
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withEmoji
          withCallingCode
          withCallingCodeButton
          onSelect={handleCountrySelect}
          containerButtonStyle={styles.countryPickerButton}
        />
        <AppIcon name="chevron-down" size={14} color="#657083" />
      </View>
      <TextInput
        value={phone}
        onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 15))}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        keyboardType="phone-pad"
        style={styles.phoneInput}
      />
    </View>
  );

  const renderTopBrand = (withHelp = true) => (
    <View style={styles.brandRow}>
      <Text style={styles.brandWordmark}>MEDIRELAY</Text>
      {withHelp ? (
        <TouchableOpacity style={styles.helpCircle} activeOpacity={0.85}>
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      ) : <View style={{ width: 52 }} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {screen === SCREENS.ROLE_PICK && (
            <View style={{ flex: 1, width: '100%' }}>
              {renderTopBrand(true)}

              <View style={styles.rolePickCenter}>
                <Text style={styles.rolePickHeading}>Who are you?</Text>
                <Text style={styles.rolePickSub}>Select your role to continue</Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.roleOptionCard}
                  onPress={() => setScreen(SCREENS.HEALTHCARE_LOGIN)}
                >
                  <View style={styles.roleIconBox}><Text style={styles.roleIconGlyph}>⚕︎</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleOptionTitle}>Healthcare Worker</Text>
                    <Text style={styles.roleOptionSub}>Doctor or Nurse</Text>
                  </View>
                  <AppIcon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.roleOptionCard}
                  onPress={() => setScreen(SCREENS.PATIENT_LOGIN)}
                >
                  <View style={styles.roleIconBox}><Text style={styles.roleIconGlyph}>👤</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleOptionTitle}>Patient / Attendant</Text>
                    <Text style={styles.roleOptionSub}>View your transfer records</Text>
                  </View>
                  <AppIcon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <Text style={styles.bottomCaption}>◍  CLINICAL GRADE SECURITY</Text>
            </View>
          )}

          {screen === SCREENS.HEALTHCARE_LOGIN && (
            <View style={{ width: '100%' }}>
              <View style={styles.portalHeader}>
                <TouchableOpacity
                  style={styles.portalBackBtn}
                  onPress={() => setScreen(SCREENS.ROLE_PICK)}
                  activeOpacity={0.9}
                >
                  <AppIcon name="back" size={20} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.portalTitle}>MEDIRELAY</Text>
                <Text style={styles.portalSubtitle}>Secure Staff Portal</Text>
              </View>

              <View style={styles.sheetCard}>
                <View style={styles.roleSegmentRow}>
                  {['Doctor', 'Nurse'].map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.segmentBtn, role === item && styles.segmentBtnActive]}
                      onPress={() => setRole(item)}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.segmentText, role === item && styles.segmentTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                {renderPhoneInput('10-15 digits')}

                <View style={styles.passwordLabelRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TouchableOpacity><Text style={styles.forgotText}>FORGOT?</Text></TouchableOpacity>
                </View>
                <View style={styles.passwordRowBox}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.outline}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                    <Text style={styles.eyeGlyph}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, !fieldValid.healthcareLogin && styles.primaryBtnDisabled]}
                  onPress={handleHealthcareSignIn}
                  disabled={!fieldValid.healthcareLogin || loading}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In  →'}</Text>
                </TouchableOpacity>

                {!!loginError && <Text style={styles.loginErrorText}>{loginError}</Text>}

                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => setScreen(SCREENS.HEALTHCARE_SIGNUP_DETAILS)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.outlineBtnText}>Create Account</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footerLegal}>🔒  HIPAA COMPLIANT • END-TO-END ENCRYPTED</Text>
              <Text style={styles.footerTiny}>By logging in, you agree to our Terms of Service and Privacy Protocol.</Text>
            </View>
          )}

          {screen === SCREENS.PATIENT_LOGIN && (
            <View style={{ width: '100%' }}>
              {renderTopBrand(true)}

              <View style={styles.patientHero}>
                <Text style={styles.patientHeroTitle}>Secure Patient{"\n"}Access</Text>
                <Text style={styles.patientHeroSub}>Real-time medical transfer tracking</Text>
              </View>

              <View style={styles.patientRowTop}>
                <View style={styles.roleIconBox}><Text style={styles.roleIconGlyph}>👤</Text></View>
                <View>
                  <Text style={styles.patientTitle}>Patient / Attendant</Text>
                  <Text style={styles.patientSub}>View your transfer records</Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              {renderPhoneInput('Enter mobile number')}

              <TouchableOpacity
                style={[styles.primaryBtn, !fieldValid.patientPhone && styles.primaryBtnDisabled]}
                onPress={handleSendOtpForPatient}
                disabled={!fieldValid.patientPhone || loading}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Sending…' : 'Send OTP  →'}</Text>
              </TouchableOpacity>

              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity style={styles.scanBtn} activeOpacity={0.9}>
                <AppIcon name="camera" size={20} color={colors.onSurface} />
                <Text style={styles.scanBtnText}>Scan QR Code instead</Text>
              </TouchableOpacity>

              <View style={styles.infoCard}>
                <Text style={styles.infoGlyph}>ℹ︎</Text>
                <Text style={styles.infoCardText}>
                  Patient access is automatically enabled once a Doctor or EMS Staff initiates a transfer request.
                  Contact your attending physician if you cannot log in.
                </Text>
              </View>

              <Text style={styles.footerBrand}>MEDIRELAY · SECURE HEALTH TRANSFERS</Text>
              <View style={styles.footerLinksRow}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
                <Text style={styles.footerLink}>Support</Text>
              </View>
            </View>
          )}

          {screen === SCREENS.HEALTHCARE_SIGNUP_DETAILS && (
            <View style={{ width: '100%' }}>
              <TouchableOpacity onPress={() => setScreen(SCREENS.HEALTHCARE_LOGIN)} style={styles.backIconRow}>
                <AppIcon name="back" size={24} color={colors.onSurface} />
              </TouchableOpacity>

              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepLabel}>STEP 1/3</Text>
                <Text style={styles.stepRight}>YOUR DETAILS</Text>
              </View>
              <View style={styles.stepBarsWrap}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={styles.stepBar} />
                <View style={styles.stepBar} />
              </View>

              <Text style={styles.signupTitle}>Create Account</Text>
              <Text style={styles.signupSub}>Fill in your details</Text>

              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.singleInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.outline}
              />

              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.singleInput}
                value={email}
                onChangeText={setEmail}
                placeholder="name@hospital.com"
                placeholderTextColor={colors.outline}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>ROLE</Text>
              <View style={styles.roleSegmentRow}>
                {['Doctor', 'Nurse'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.segmentBtn, role === item && styles.segmentBtnActiveLight]}
                    onPress={() => setRole(item)}
                  >
                    <Text style={[styles.segmentTextDark, role === item && styles.segmentTextDarkActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>HOSPITAL NAME</Text>
              <TextInput
                style={styles.singleInput}
                value={hospital}
                onChangeText={setHospital}
                placeholder="Search for your hospital"
                placeholderTextColor={colors.outline}
              />

              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              {renderPhoneInput('Phone number')}

              <TouchableOpacity
                style={[styles.primaryBtn, !fieldValid.signupDetails && styles.primaryBtnDisabled]}
                onPress={handleSignupNext}
                disabled={!fieldValid.signupDetails}
              >
                <Text style={styles.primaryBtnText}>Next  →</Text>
              </TouchableOpacity>

              <Text style={styles.footerTinyDark}>
                By creating an account, you agree to our <Text style={styles.linkInline}>Clinical Guidelines</Text> and <Text style={styles.linkInline}>Data Protocol</Text>.
              </Text>
            </View>
          )}

          {screen === SCREENS.OTP_VERIFY && (
            <View style={{ width: '100%' }}>
              <TouchableOpacity 
                onPress={() => {
                  if (otpFlow === 'signup') {
                    setScreen(SCREENS.HEALTHCARE_SIGNUP_DETAILS);
                  } else {
                    setScreen(SCREENS.ROLE_PICK);
                  }
                  setOtp('');
                  setOtpError('');
                }} 
                style={styles.backIconRow}
              >
                <AppIcon name="back" size={24} color={colors.onSurface} />
              </TouchableOpacity>

              <View style={styles.stepHeaderRowOtp}>
                <Text style={styles.stepLabel}>VERIFY PHONE</Text>
                <Text style={styles.stepRight}>Step 2 of 3</Text>
              </View>
              <View style={styles.stepBarsWrap}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={styles.stepBar} />
              </View>

              <Text style={styles.otpBrand}>MEDIRELAY</Text>
              <View style={styles.otpIconCircle}><Text style={styles.otpIconGlyph}>📶</Text></View>

              <Text style={styles.otpTitle}>Verify Your Number</Text>
              <Text style={styles.otpSub}>OTP sent to {maskedPhone}</Text>

              <View style={{ marginTop: spacing[6], alignItems: 'center' }}>
                <OTPBoxes value={otp} onChange={setOtp} length={6} />
              </View>

              <View style={styles.resendWrap}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendText}>Resend in 0:{String(resendTimer).padStart(2, '0')}</Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={styles.resendAction}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, otp.length < 6 && styles.primaryBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={otp.length < 6 || loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Verifying…' : 'Verify  →'}</Text>
              </TouchableOpacity>

              <View style={styles.otpExpirePill}>
                <View style={styles.redDot} />
                <Text style={styles.otpExpireText}>OTP EXPIRES IN {Math.floor(otpExpireTimer / 60)}:{String(otpExpireTimer % 60).padStart(2, '0')}</Text>
              </View>
            </View>
          )}

          {screen === SCREENS.SET_PASSWORD && (
            <View style={{ width: '100%' }}>
              <TouchableOpacity 
                onPress={() => {
                  setScreen(SCREENS.OTP_VERIFY);
                  setSignupPassword('');
                  setConfirmPassword('');
                  setSignupError('');
                }} 
                style={styles.backIconRow}
              >
                <AppIcon name="back" size={24} color={colors.onSurface} />
              </TouchableOpacity>

              <Text style={styles.otpBrand}>MEDIRELAY</Text>

              <View style={styles.stepHeaderRowOtp}>
                <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
                <Text style={styles.stepRight}>SET PASSWORD</Text>
              </View>
              <View style={styles.stepBarsWrap}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
              </View>

              <Text style={styles.signupTitle}>Secure Your Account</Text>
              <Text style={styles.signupSub}>Set a strong password</Text>

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.passwordRowBoxLarge}>
                <TextInput
                  value={signupPassword}
                  onChangeText={setSignupPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  secureTextEntry={!showSignupPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity onPress={() => setShowSignupPassword((s) => !s)}>
                  <Text style={styles.eyeGlyph}>{showSignupPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.strengthBarsRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      i <= passwordStrength ? styles.strengthBarOn : styles.strengthBarOff,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.strengthCaptionRow}>
                <Text style={styles.strengthLabel}>STRONG SECURITY</Text>
                <Text style={styles.strengthPct}>{Math.round((passwordStrength / 4) * 100)}%</Text>
              </View>

              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.passwordRowBoxLarge}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)}>
                  <Text style={styles.eyeGlyph}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && (
                <Text style={[styles.matchText, { color: passwordsMatch ? '#047857' : colors.error }]}>
                  {passwordsMatch ? 'Passwords match perfectly' : "Passwords don't match"}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, !fieldValid.signupPassword && styles.primaryBtnDisabled]}
                onPress={handleCreateAccount}
                disabled={!fieldValid.signupPassword || loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Creating…' : 'Create Account  →'}</Text>
              </TouchableOpacity>

              {!!signupError && <Text style={styles.signupErrorText}>{signupError}</Text>}

              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>SECURITY REQUIREMENTS</Text>
                <Text style={styles.securityItem}>✹  Minimum 6 characters</Text>
                <Text style={styles.securityItemOff}>○  Stronger passwords are recommended</Text>
                <Text style={styles.securityItemOff}>○  Avoid using your name or email</Text>
              </View>

              <View style={styles.footerLinksRow}>
                <Text style={styles.footerLink}>TERMS OF SERVICE</Text>
                <Text style={styles.footerLink}>PRIVACY POLICY</Text>
              </View>
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
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  brandWordmark: {
    fontSize: 42 / 2,
    letterSpacing: 1,
    color: '#0A1628',
    fontWeight: '800',
  },
  helpCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dce7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 26 / 1.6,
    fontWeight: '800',
    color: '#0A1628',
  },
  rolePickCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing[10],
  },
  rolePickHeading: {
    ...typography.displayMd,
    color: '#0A1628',
    textAlign: 'center',
    marginBottom: spacing[2],
    fontWeight: '700',
  },
  rolePickSub: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#f7f8fc',
    borderRadius: 22,
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  roleIconBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#e9edf9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconGlyph: {
    fontSize: 27 / 1.4,
    color: '#0A1628',
  },
  roleOptionTitle: {
    ...typography.headlineSm,
    color: '#0A1628',
    fontWeight: '700',
  },
  roleOptionSub: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  bottomCaption: {
    textAlign: 'center',
    color: '#8e95a3',
    letterSpacing: 2,
    marginBottom: spacing[2],
    ...typography.labelMd,
  },
  portalHeader: {
    backgroundColor: '#0A1628',
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
    minHeight: 210,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -spacing[6],
    marginTop: -spacing[5],
    marginBottom: -40,
    paddingTop: spacing[8],
  },
  portalBackBtn: {
    position: 'absolute',
    top: spacing[6],
    right: spacing[6],
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalTitle: {
    fontSize: 50 / 2,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#fff',
    marginBottom: spacing[2],
  },
  portalSubtitle: {
    ...typography.headlineSm,
    color: 'rgba(255,255,255,0.75)',
  },
  sheetCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing[5],
    ...shadow.md,
    marginBottom: spacing[6],
  },
  roleSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#e9edf8',
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing[5],
    gap: spacing[1],
  },
  segmentBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0A1628',
  },
  segmentBtnActiveLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe1f0',
  },
  segmentText: {
    ...typography.headlineSm,
    color: '#5b6271',
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#fff',
  },
  segmentTextDark: {
    ...typography.headlineSm,
    color: '#414756',
    fontWeight: '700',
  },
  segmentTextDarkActive: {
    color: '#0A1628',
  },
  inputLabel: {
    ...typography.labelSm,
    color: '#313744',
    marginBottom: spacing[2],
    letterSpacing: 1.5,
  },
  phoneRowBox: {
    flexDirection: 'row',
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing[5],
    backgroundColor: '#edf1fb',
    borderWidth: 1,
    borderColor: '#dbe1ef',
  },
  prefixBox: {
    width: 138,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
    borderRightWidth: 1,
    borderRightColor: '#d6ddeb',
  },
  countryPickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    ...typography.headlineSm,
    color: '#0A1628',
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing[4],
    color: '#0A1628',
    fontSize: 36 / 2,
    fontWeight: '500',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 1,
  },
  passwordRowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 14,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
    backgroundColor: '#edf1fb',
    borderWidth: 1,
    borderColor: '#dbe1ef',
  },
  passwordRowBoxLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 14,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: '#edf1fb',
    borderWidth: 1,
    borderColor: '#dbe1ef',
  },
  passwordInput: {
    flex: 1,
    color: '#0A1628',
    fontSize: 18,
    fontWeight: '500',
  },
  eyeGlyph: {
    fontSize: 18,
    opacity: 0.6,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 35 / 2,
    fontWeight: '700',
  },
  outlineBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#0A1628',
    fontSize: 34 / 2,
    fontWeight: '700',
  },
  footerLegal: {
    textAlign: 'center',
    color: '#3d4250',
    letterSpacing: 2,
    ...typography.labelMd,
    marginBottom: spacing[2],
  },
  footerTiny: {
    textAlign: 'center',
    color: '#7a8090',
    ...typography.bodySm,
    marginBottom: spacing[4],
  },
  patientHero: {
    borderRadius: 28,
    backgroundColor: '#10223e',
    padding: spacing[6],
    marginTop: spacing[2],
    marginBottom: spacing[5],
  },
  patientHeroTitle: {
    fontSize: 62 / 2,
    lineHeight: 70 / 2,
    color: '#fff',
    fontWeight: '800',
    marginBottom: spacing[2],
  },
  patientHeroSub: {
    ...typography.headlineSm,
    color: 'rgba(255,255,255,0.4)',
  },
  patientRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  patientTitle: {
    ...typography.displayMd,
    color: '#0A1628',
    fontSize: 56 / 2,
    fontWeight: '700',
  },
  patientSub: {
    ...typography.headlineSm,
    color: colors.onSurfaceVariant,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
    marginTop: spacing[1],
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d6deef',
  },
  orText: {
    marginHorizontal: spacing[4],
    color: '#606676',
    ...typography.labelMd,
  },
  scanBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  scanBtnText: {
    color: '#0A1628',
    fontSize: 36 / 2,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#edf1fb',
    borderRadius: 20,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: '#87c8b6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[8],
  },
  infoGlyph: {
    fontSize: 16,
    color: '#0f766e',
    marginTop: 2,
    marginRight: spacing[2],
  },
  infoCardText: {
    flex: 1,
    color: '#3f4654',
    fontSize: 30 / 2,
    lineHeight: 46 / 2,
    fontWeight: '500',
  },
  footerBrand: {
    textAlign: 'center',
    color: '#596071',
    letterSpacing: 2,
    ...typography.labelMd,
    marginBottom: spacing[4],
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[8],
    marginBottom: spacing[3],
  },
  footerLink: {
    color: '#2f3644',
    ...typography.titleMd,
  },
  backIconRow: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  stepHeaderRowOtp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  stepLabel: {
    color: '#111827',
    fontWeight: '700',
    ...typography.headlineSm,
    fontStyle: 'italic',
  },
  stepRight: {
    color: '#313744',
    fontWeight: '700',
    ...typography.headlineSm,
  },
  stepBarsWrap: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  stepBar: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#cfd6e8',
  },
  stepBarActive: {
    backgroundColor: '#0A1628',
  },
  signupTitle: {
    color: '#0A1628',
    fontSize: 64 / 2,
    lineHeight: 74 / 2,
    fontWeight: '800',
    marginBottom: spacing[1],
  },
  signupSub: {
    ...typography.headlineSm,
    color: '#444b5a',
    marginBottom: spacing[4],
  },
  singleInput: {
    height: 58,
    borderRadius: 14,
    backgroundColor: '#edf1fb',
    borderWidth: 1,
    borderColor: '#dbe1ef',
    paddingHorizontal: spacing[4],
    color: '#0A1628',
    fontSize: 34 / 2,
    marginBottom: spacing[4],
  },
  labelWithInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  infoTiny: {
    color: '#6b7280',
    fontSize: 16,
  },
  helperText: {
    ...typography.bodyMd,
    color: '#676f7f',
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  footerTinyDark: {
    textAlign: 'center',
    ...typography.bodyMd,
    color: '#666d7c',
    marginBottom: spacing[3],
  },
  linkInline: {
    color: '#111827',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  otpBrand: {
    textAlign: 'center',
    fontSize: 56 / 2,
    color: '#0A1628',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing[4],
  },
  otpIconCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#0A1628',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[5],
    ...shadow.sm,
  },
  otpIconGlyph: {
    fontSize: 34,
    color: '#fff',
  },
  otpTitle: {
    textAlign: 'center',
    fontSize: 60 / 2,
    lineHeight: 68 / 2,
    color: '#0A1628',
    fontWeight: '800',
    marginBottom: spacing[2],
  },
  otpSub: {
    textAlign: 'center',
    color: '#3e4554',
    ...typography.displayMd,
    fontSize: 48 / 2,
    marginBottom: spacing[2],
  },
  resendWrap: {
    alignItems: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
  resendText: {
    ...typography.displayMd,
    color: '#2f3644',
    fontSize: 44 / 2,
  },
  resendAction: {
    ...typography.titleMd,
    textDecorationLine: 'underline',
    color: '#0A1628',
  },
  otpExpirePill: {
    alignSelf: 'center',
    marginTop: spacing[6],
    backgroundColor: '#dce7fb',
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d11a2a',
  },
  otpExpireText: {
    color: '#0A1628',
    fontWeight: '800',
    letterSpacing: 1,
    ...typography.titleSm,
  },
  otpErrorText: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  loginErrorText: {
    ...typography.bodySm,
    color: colors.error,
    textAlign: 'center',
    marginTop: -spacing[2],
    marginBottom: spacing[3],
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  strengthBar: {
    flex: 1,
    height: 8,
    borderRadius: 999,
  },
  strengthBarOn: {
    backgroundColor: '#047857',
  },
  strengthBarOff: {
    backgroundColor: '#cfd6e8',
  },
  strengthCaptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  strengthLabel: {
    color: '#047857',
    fontWeight: '700',
    ...typography.titleSm,
  },
  strengthPct: {
    color: '#2f3644',
    fontWeight: '700',
    ...typography.titleMd,
  },
  matchText: {
    ...typography.headlineSm,
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  signupErrorText: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
    marginTop: -spacing[2],
    marginBottom: spacing[4],
  },
  securityCard: {
    backgroundColor: '#e9edf8',
    borderRadius: 22,
    padding: spacing[5],
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  securityTitle: {
    ...typography.labelSm,
    color: '#6b7280',
    letterSpacing: 2,
    marginBottom: spacing[3],
  },
  securityItem: {
    ...typography.displayMd,
    fontSize: 40 / 2,
    color: '#2f3644',
    marginBottom: spacing[2],
  },
  securityItemOff: {
    ...typography.displayMd,
    fontSize: 40 / 2,
    color: '#2f3644',
    opacity: 0.8,
  },
});
