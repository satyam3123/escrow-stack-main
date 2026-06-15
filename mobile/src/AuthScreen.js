import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from './api';
import { colors, fonts } from './theme';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const fn = mode === 'login' ? api.login : api.register;
      const { token, user } = await fn(email.trim().toLowerCase(), password);
      await onAuth(token, user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>↗</Text>
          </View>
          <View>
            <Text style={styles.brand}>Escrow Stack</Text>
            <Text style={styles.eyebrow}>LIVE MARKETS</Text>
          </View>
        </View>

        <Text style={styles.lede}>Markets,{'\n'}held in confidence.</Text>

        <View style={styles.card}>
          <Text style={[styles.eyebrow, { color: colors.gold }]}>
            {mode === 'login' ? 'ACCOUNT ACCESS' : 'OPEN AN ACCOUNT'}
          </Text>
          <Text style={styles.h1}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.faint}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={submit} disabled={busy} activeOpacity={0.85}>
            {busy ? (
              <ActivityIndicator color="#1a1206" />
            ) : (
              <Text style={styles.btnText}>{mode === 'login' ? 'Sign in  →' : 'Create account  →'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switch}
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            <Text style={styles.muted}>
              {mode === 'login' ? 'New to Escrow Stack? ' : 'Already registered? '}
              <Text style={styles.link}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.demo}
          onPress={() => {
            setEmail('alice@demo.com');
            setPassword('password');
          }}
        >
          <View>
            <Text style={styles.eyebrow}>DEMO ACCOUNT</Text>
            <Text style={styles.demoText}>alice@demo.com · password</Text>
          </View>
          <Text style={styles.faintArrow}>use →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 64, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(216,184,120,0.3)',
    backgroundColor: 'rgba(216,184,120,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: { color: colors.gold, fontSize: 20, fontFamily: fonts.bodyBold },
  brand: { color: colors.ink, fontSize: 18, fontFamily: fonts.display },
  eyebrow: { color: colors.faint, fontSize: 10, letterSpacing: 2, fontFamily: fonts.monoReg },
  lede: { color: colors.ink, fontSize: 30, lineHeight: 36, fontFamily: fonts.display, marginBottom: 28 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
  },
  h1: { color: colors.ink, fontSize: 28, fontFamily: fonts.display, marginTop: 8 },
  label: { color: colors.faint, fontSize: 10, letterSpacing: 2, fontFamily: fonts.monoReg, marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: colors.bg2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  error: {
    color: colors.down,
    backgroundColor: 'rgba(223,107,98,0.1)',
    borderColor: 'rgba(223,107,98,0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 16,
    fontSize: 13,
    fontFamily: fonts.mono,
  },
  btn: { backgroundColor: colors.gold, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  btnText: { color: '#1a1206', fontFamily: fonts.bodyBold, fontSize: 15 },
  switch: { marginTop: 18, alignItems: 'center' },
  muted: { color: colors.muted, fontSize: 14, fontFamily: fonts.body },
  link: { color: colors.gold, fontFamily: fonts.bodySemi },
  demo: {
    marginTop: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoText: { color: colors.muted, fontSize: 13, fontFamily: fonts.mono, marginTop: 4 },
  faintArrow: { color: colors.faint, fontSize: 12, fontFamily: fonts.body },
});
