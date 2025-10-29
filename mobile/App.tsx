import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from './lib/supabase'
import AuthScreen from './screens/AuthScreen'
import MainTabsNavigator from './navigation/MainTabsNavigator'
import SettingsScreen from './screens/SettingsScreen'
import { useThemeColors } from './theme/colors'
import type { RootStackParamList } from './types/navigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = useThemeColors(isDark)

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {session ? (
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      ) : (
        <AuthScreen />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
