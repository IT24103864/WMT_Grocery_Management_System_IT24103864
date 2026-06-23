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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
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
              <Ionicons name="lock-open-outline" size={38} color="#2E7D32" />
            </View>
            <Text style={S.appName}>GroceryApp</Text>
            <Text style={S.tagline}>Reset your password</Text>
          </View>

          {/* ── Card ────────────────────────────────────────── */}
          <View style={[S.card, shadows.large]}>

            {sent ? (
              /* ── Success state ────────────────────────────── */
              <View style={S.successContainer}>
                <View style={S.successCircle}>
                  <Ionicons name="mail" size={36} color="#ffffff" />
                </View>

                <Text style={S.successTitle}>Check Your Email</Text>
                <Text style={S.successBody}>
                  A 6-character reset code has been sent to{'\n'}
                  <Text style={S.successEmail}>{email}</Text>
                </Text>

                <View style={S.infoBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#1d4ed8" />
                  <Text style={S.infoText}>
                    The code expires in 15 minutes. Check your spam folder if you don't see it.
                  </Text>
                </View>

                <View style={S.btnWrapper}>
                  <GreenButton
                    title="Enter Reset Code"
                    onPress={() => navigation.navigate('ResetPassword', { email })}
                    fullWidth
                  />
                </View>

                <TouchableOpacity
                  style={S.resendRow}
                  onPress={() => { setSent(false); setEmail(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={S.resendText}>Try a different email</Text>
                </TouchableOpacity>
              </View>

            ) : (
              /* ── Request form ─────────────────────────────── */
              <>
                <Text style={S.cardTitle}>Forgot Password?</Text>
                <Text style={S.cardSubtitle}>
                  Enter the email linked to your account. We'll send you a 6-character reset code.
                </Text>

                <View style={S.fieldsArea}>
                  <InputField
                    label="Email Address"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    leftIcon="mail-outline"
                  />
                </View>

                {error ? (
                  <View style={S.errorBox}>
                    <Ionicons name="alert-circle-outline" size={15} color="#991b1b" />
                    <Text style={S.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={S.btnWrapper}>
                  <GreenButton
                    title="Send Reset Code"
                    onPress={handleSend}
                    loading={loading}
                    fullWidth
                  />
                </View>

                <TouchableOpacity
                  style={S.linkRow}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back-outline" size={14} color="#64748b" />
                  <Text style={S.linkText}>  Back to </Text>
                  <Text style={S.linkHighlight}>Sign In</Text>
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
  cardTitle:    { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginTop: 6, lineHeight: 20 },
  fieldsArea:   { marginTop: 24 },

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
  successBody:  { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successEmail: { fontWeight: 'bold', color: '#0f172a' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 8,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 18 },
  resendRow:  { marginTop: 16 },
  resendText: { fontSize: 14, color: '#64748b', textDecorationLine: 'underline' },

  bottomSpacer: { height: 40 },
});
