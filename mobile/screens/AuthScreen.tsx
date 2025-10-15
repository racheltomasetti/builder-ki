import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        // Try to sign in immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        Alert.alert('Success', 'Account created and signed in!')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        Alert.alert('Success', 'Signed in successfully!')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.titleDark]}>ki</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Email"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Password"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    color: '#2563eb',
    fontSize: 14,
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: '#111827',
  },
  titleDark: {
    color: '#f9fafb',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
  inputDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    color: '#f9fafb',
  },
})
