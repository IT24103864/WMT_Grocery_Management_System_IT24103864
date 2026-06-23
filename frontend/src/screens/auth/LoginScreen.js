import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, Platform,
  ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';
import InputField from '../../components/InputField';
import GreenButton from '../../components/GreenButton';
import { shadows } from '../../theme/styles';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await login(data.token, data.user);
    } catch (err) {
      if (!err.response) setError('Cannot connect to server');
      else if (err.response.status === 401) setError('Invalid email or password');
      else setError('Something went wrong, please try again');
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
            <View style={S.logoCircle}>
              <Ionicons name="cart-outline" size={44} color="#2E7D32" />
            </View>
            <Text style={S.appName}>GroceryApp</Text>
            <Text style={S.tagline}>Fresh from farm to your door</Text>
          </View>

          {/* ── Login card ──────────────────────────────────── */}
          <View style={[S.card, shadows.large]}>
            <Text style={S.cardTitle}>Welcome Back</Text>
            <Text style={S.cardSubtitle}>Sign in to continue</Text>

            <View style={S.fieldsArea}>
              <InputField
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                leftIcon="mail-outline"
              />
              <InputField
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowPassword(v => !v)}
              />
            </View>

            <TouchableOpacity
              style={S.forgotRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={S.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {error ? (
              <View style={S.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#991b1b" />
                <Text style={S.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={S.btnWrapper}>
              <GreenButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
              />
            </View>

            {/* OR divider */}
            <View style={S.dividerRow}>
              <View style={S.dividerLine} />
              <Text style={S.dividerText}>OR</Text>
              <View style={S.dividerLine} />
            </View>

            {/* Register link */}
            <TouchableOpacity
              style={S.linkRow}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={S.linkText}>Don't have an account? </Text>
              <Text style={S.linkHighlight}>Register</Text>
            </TouchableOpacity>
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

  // ── Hero ────────────────────────────────────────────
  hero: {
    paddingTop: STATUS_BAR_HEIGHT + 28,
    paddingBottom: 60,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 14,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },

  // ── Card ────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -40,
    padding: 28,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  fieldsArea: {
    marginTop: 24,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // ── Error ───────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
  },

  // ── Button ──────────────────────────────────────────
  btnWrapper: {
    marginTop: 12,
  },

  // ── Divider ─────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94a3b8',
    paddingHorizontal: 12,
  },

  // ── Register link ───────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText:      { fontSize: 14, color: '#64748b' },
  linkHighlight: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },

  bottomSpacer: { height: 40 },
});
