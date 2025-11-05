import { Text, TextProps, StyleSheet } from 'react-native'

/**
 * Custom Text component with Perpetua font applied by default
 * This component wraps React Native's Text with the Perpetua font family
 */
export function ThemedText(props: TextProps) {
  const { style, ...otherProps } = props

  return (
    <Text
      style={[styles.defaultText, style]}
      {...otherProps}
    />
  )
}

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'Perpetua',
  },
})
