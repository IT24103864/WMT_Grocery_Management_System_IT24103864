import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, Platform,
  ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import InputField from '../../components/InputField';
import GreenButton from '../../components/GreenButton';
import { shadows } from '../../theme/styles';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

export default function ResetPasswordScreen({ navigation, route }) {
  const { email } = route.params ?? {};

  const [otp, setOtp]               = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  const handleReset = async () => {
    setError('');
    if (!otp.trim())     { setError('Enter the 6-character reset code from your email'); return; }
    if (otp.length !== 6){ setError('Reset code must be exactly 6 characters'); return; }
    if (!password)       { setError('Enter your new password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { otp: otp.trim().toUpperCase(), password });
      setSuccess(true);
    } catch (err) {
      if (!err.response) setError('Cannot connect to server. Check your connection.');
      else setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={S.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={S.flex}
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Green hero ──────────────────────────────────── */}
          <View style={S.hero}>
            <TouchableOpacity
              style={S.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#ffffff" />
            </TouchableOpacity>

            <View style={S.logoCircle}>
              <Ionicons name="shield-checkmark-outline" size={38} color="#2E7D32" />
            </View>
            <Text style={S.appName}>GroceryApp</Text>
            <Text style={S.tagline}>Create a new password</Text>
          </View>

          {/* ── Card ────────────────────────────────────────── */}
          <View style={[S.card, shadows.large]}>

            {success ? (
              /* ── Success state ────────────────────────────── */
              <View style={S.successContainer}>
                <View style={S.successCircle}>
                  <Ionicons name="checkmark" size={42} color="#ffffff" />
                </View>
                <Text style={S.successTitle}>Password Updated!</Text>
                <Text style={S.successBody}>
                  Your password has been reset successfully.{'\n'}You can now sign in with your new password.
                </Text>
                <View style={S.btnWrapper}>
                  <GreenButton
                    title="Go to Sign In"
                    onPress={() => navigation.navigate('Login')}
                    fullWidth
                  />
                </View>
              </View>

            ) : (
              /* ── Reset form ───────────────────────────────── */
              <>
                <Text style={S.cardTitle}>Reset Password</Text>
                {email ? (
                  <Text style={S.cardSubtitle}>
                    Enter the code sent to <Text style={S.emailHighlight}>{email}</Text> and choose a new password.
                  </Text>
                ) : (
                  <Text style={S.cardSubtitle}>
                    Enter the 6-character code from your email and choose a new password.
                  </Text>
                )}

                <View style={S.fieldsArea}>
                  {/* OTP code field */}
                  <View style={S.otpContainer}>
                    <Text style={S.otpLabel}>Reset Code</Text>
                    <InputField
                      placeholder="e.g. A1B2C3"
                      value={otp}
                      onChangeText={(v) => setOtp(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                      leftIcon="key-outline"
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>

                  <InputField
                    label="New Password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                    leftIcon="lock-closed-outline"
                    rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'}
                    onRightPress={() => setShowPw(v => !v)}
                  />
                  <InputField
                    label="Confirm New Password"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showCf}
                    leftIcon="lock-closed-outline"
                    rightIcon={showCf ? 'eye-off-outline' : 'eye-outline'}
                    onRightPress={() => setShowCf(v => !v)}
                  />
                </View>

                {/* Password match indicator */}
                {confirm.length > 0 && (
                  <View style={S.matchRow}>
                    <Ionicons
                      name={password === confirm ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={password === confirm ? '#2E7D32' : '#dc2626'}
                    />
                    <Text style={[S.matchText, { color: password === confirm ? '#2E7D32' : '#dc2626' }]}>
                      {password === confirm ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  </View>
                )}

                {error ? (
                  <View style={S.errorBox}>
                    <Ionicons name="alert-circle-outline" size={15} color="#991b1b" />
                    <Text style={S.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={S.btnWrapper}>
                  <GreenButton
                    title="Reset Password"
                    onPress={handleReset}
                    loading={loading}
                    fullWidth
                  />
                </View>

                <TouchableOpacity
                  style={S.linkRow}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                >
                  <Text style={S.linkText}>Didn't receive a code? </Text>
                  <Text style={S.linkHighlight}>Resend</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={S.bottomSpacer} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1 },

  hero: {
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 56,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 12,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName:  { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginTop: 12 },
  tagline:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -40,
    padding: 28,
  },
  cardTitle:      { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  cardSubtitle:   { fontSize: 14, color: '#64748b', marginTop: 6, lineHeight: 20 },
  emailHighlight: { fontWeight: 'bold', color: '#0f172a' },
  fieldsArea:     { marginTop: 24 },

  otpContainer: { marginBottom: 4 },
  otpLabel:     { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 4 },
  matchText: { fontSize: 12 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991b1b' },

  btnWrapper: { marginTop: 12 },

  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkText:      { fontSize: 14, color: '#64748b' },
  linkHighlight: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },

  // Success state
  successContainer: { alignItems: 'center', paddingTop: 8 },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  successBody: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  bottomSpacer: { height: 40 },
});
