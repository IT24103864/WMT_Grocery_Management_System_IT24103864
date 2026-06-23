import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, Platform,
  ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';
import InputField from '../../components/InputField';
import GreenButton from '../../components/GreenButton';
import { shadows } from '../../theme/styles';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24);

export default function RegisterScreen({ navigation }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !confirm) { setError('All fields are required'); return; }
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Account created!', 'You can now log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      if (!err.response) setError('Cannot connect to server');
      else if (err.response.status === 409) setError('Email already in use');
      else setError(err.response?.data?.message || 'Something went wrong');
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
          {/* ── Green hero (shorter than Login) ─────────────── */}
          <View style={S.hero}>
            <View style={S.logoCircle}>
              <Ionicons name="cart-outline" size={36} color="#2E7D32" />
            </View>
            <Text style={S.appName}>GroceryApp</Text>
          </View>

          {/* ── Register card ────────────────────────────────── */}
          <View style={[S.card, shadows.large]}>
            <Text style={S.cardTitle}>Create Account</Text>
            <Text style={S.cardSubtitle}>Join our grocery community</Text>

            <View style={S.fieldsArea}>
              <InputField
                label="Full Name"
                placeholder="John Smith"
                value={name}
                onChangeText={setName}
                leftIcon="person-outline"
              />
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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                leftIcon="lock-closed-outline"
                rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowPw(v => !v)}
              />
              <InputField
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showCf}
                leftIcon="lock-closed-outline"
                rightIcon={showCf ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowCf(v => !v)}
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
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                fullWidth
              />
            </View>

            {/* Login link */}
            <TouchableOpacity
              style={S.linkRow}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={S.linkText}>Already have an account? </Text>
              <Text style={S.linkHighlight}>Sign In</Text>
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
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 50,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
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
    marginTop: 20,
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
    marginTop: 4,
  },

  // ── Login link ──────────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkText:      { fontSize: 14, color: '#64748b' },
  linkHighlight: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },

  bottomSpacer: { height: 40 },
});
