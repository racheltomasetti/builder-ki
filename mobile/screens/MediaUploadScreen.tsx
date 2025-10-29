import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from "react-native";
import { useThemeColors } from "../theme/colors";
import type { MediaUploadScreenProps } from "../types/navigation";

export default function MediaUploadScreen({ navigation }: MediaUploadScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.tx }]}>Media Upload</Text>
        <Text style={[styles.subtitle, { color: colors.tx2 }]}>
          Coming soon...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});
