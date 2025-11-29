import { View, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useThemeColors } from "../theme/colors";
import type { CommunityScreenProps } from "../types/navigation";
import { ThemedText } from "../components/ThemedText";

export default function CommunityScreen({
  navigation: tabNavigation,
}: CommunityScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Centered placeholder content */}
      <View style={styles.content}>
        <Ionicons name="people-outline" size={80} color={colors.tx3} />
        <ThemedText style={[styles.title, { color: colors.tx }]}>
          Community
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.tx2 }]}>
          Coming Soon
        </ThemedText>
        <ThemedText style={[styles.description, { color: colors.tx3 }]}>
          Connect with others on their journey
        </ThemedText>
      </View>
    </View>
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
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
