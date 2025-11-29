import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useState } from "react";
import { useThemeColors } from "../theme/colors";
import { ThemedText } from "./ThemedText";

type Capture = {
  id: string;
  type: string;
  file_url: string | null;
  transcription: string | null;
  created_at: string;
};

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
};

interface ActivityBlockProps {
  session: TimerSession;
  linkedCaptures: Capture[];
  isDark: boolean;
}

export default function ActivityBlock({
  session,
  linkedCaptures,
  isDark,
}: ActivityBlockProps) {
  const colors = useThemeColors(isDark);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "In progress...";

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const duration = calculateDuration(session.start_time, session.end_time);
  const isActive = session.status === "active";

  return (
    <View style={styles.container}>
      {/* Timeline bar */}
      <View style={styles.timelineBar}>
        <ThemedText style={[styles.timeText, { color: colors.tx3 }]}>
          {formatTime(session.start_time)}
        </ThemedText>
        <View style={[styles.line, { backgroundColor: colors.accent2 }]}>
          <View
            style={[styles.lineDot, { backgroundColor: colors.accent2 }]}
          />
          <View
            style={[
              styles.lineDot,
              styles.lineDotEnd,
              { backgroundColor: colors.accent2 },
            ]}
          />
        </View>
        {session.end_time && (
          <ThemedText style={[styles.timeText, { color: colors.tx3 }]}>
            {formatTime(session.end_time)}
          </ThemedText>
        )}
        <ThemedText style={[styles.durationText, { color: colors.accent2 }]}>
          ({duration})
        </ThemedText>
      </View>

      {/* Activity block */}
      <View
        style={[
          styles.activityBlock,
          {
            backgroundColor: colors.ui,
            borderLeftColor: colors.accent2,
          },
        ]}
      >
        <View style={styles.activityHeader}>
          <Ionicons name="timer-outline" size={20} color={colors.accent2} />
          <ThemedText style={[styles.activityName, { color: colors.tx }]}>
            {session.name}
          </ThemedText>
          {isActive && (
            <View
              style={[styles.activeBadge, { backgroundColor: colors.accent2 }]}
            >
              <ThemedText style={[styles.activeBadgeText, { color: colors.bg }]}>
                Active
              </ThemedText>
            </View>
          )}
        </View>

        {/* Linked captures */}
        {linkedCaptures.length > 0 && (
          <View
            style={[
              styles.capturesContainer,
              { borderTopColor: colors.ui3 },
            ]}
          >
            {linkedCaptures.map((capture) => (
              <View key={capture.id} style={styles.captureItem}>
                <ThemedText style={[styles.captureTime, { color: colors.tx3 }]}>
                  {formatTime(capture.created_at)} - Voice note
                </ThemedText>
                {capture.transcription && (
                  <ThemedText
                    style={[styles.captureTranscription, { color: colors.tx }]}
                  >
                    {capture.transcription}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  timelineBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  line: {
    flex: 1,
    height: 2,
    position: "relative",
  },
  lineDot: {
    position: "absolute",
    left: 0,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineDotEnd: {
    left: "auto",
    right: 0,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activityBlock: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  capturesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  captureItem: {
    paddingLeft: 8,
  },
  captureTime: {
    fontSize: 11,
    marginBottom: 4,
  },
  captureTranscription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
