import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../theme/colors";
import { ThemedText } from "./ThemedText";
import ActivityBlock from "./ActivityBlock";

type Capture = {
  id: string;
  type: string;
  file_url: string | null;
  transcription: string | null;
  note_type: string;
  created_at: string;
  cycle_day?: number | null;
  cycle_phase?: string | null;
  timer_session_ids?: string[] | null;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: string;
  original_date: string;
  caption: string | null;
  created_at: string;
  timer_session_ids?: string[] | null;
};

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
};

type TimelineItem =
  | {
      type: "activity";
      session: TimerSession;
      linkedCaptures: Capture[];
      timestamp: string;
    }
  | { type: "capture"; capture: Capture; timestamp: string }
  | { type: "media"; media: MediaItem; timestamp: string };

interface TimelineViewProps {
  intention?: Capture;
  timeline: TimelineItem[];
  reflection?: Capture;
  isDark: boolean;
}

export default function TimelineView({
  intention,
  timeline,
  reflection,
  isDark,
}: TimelineViewProps) {
  const colors = useThemeColors(isDark);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      {/* Intention */}
      {intention && (
        <View
          style={[
            styles.section,
            styles.intentionSection,
            { backgroundColor: colors.ui },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="sunny-outline" size={20} color="#D4AF37" />
            <ThemedText
              style={[styles.sectionTitle, styles.italic, { color: "#D4AF37" }]}
            >
              Intention
            </ThemedText>
          </View>
          <ThemedText style={[styles.timestamp, { color: colors.tx3 }]}>
            {formatTime(intention.created_at)}
          </ThemedText>
          {intention.transcription && (
            <ThemedText style={[styles.transcription, { color: colors.tx }]}>
              {intention.transcription}
            </ThemedText>
          )}
        </View>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <View
          style={[
            styles.section,
            styles.timelineSection,
            { backgroundColor: colors.ui },
          ]}
        >
          {timeline.map((item, index) => {
            if (item.type === "activity") {
              return (
                <ActivityBlock
                  key={item.session.id}
                  session={item.session}
                  linkedCaptures={item.linkedCaptures}
                  isDark={isDark}
                />
              );
            } else if (item.type === "capture") {
              const capture = item.capture;
              return (
                <View
                  key={capture.id}
                  style={[
                    styles.captureItem,
                    { borderLeftColor: colors.accent },
                  ]}
                >
                  <ThemedText style={[styles.captureTime, { color: colors.tx3 }]}>
                    ~ {formatTime(capture.created_at)} ~
                  </ThemedText>
                  {capture.transcription && (
                    <ThemedText
                      style={[styles.transcription, { color: colors.tx }]}
                    >
                      {capture.transcription}
                    </ThemedText>
                  )}
                </View>
              );
            } else if (item.type === "media") {
              const media = item.media;
              return (
                <View key={media.id} style={styles.mediaItem}>
                  <ThemedText style={[styles.captureTime, { color: colors.tx3 }]}>
                    ~ {formatTime(media.created_at)} ~
                  </ThemedText>
                  <Image
                    source={{ uri: media.file_url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {media.caption && (
                    <ThemedText
                      style={[styles.mediaCaption, { color: colors.tx2 }]}
                    >
                      {media.caption}
                    </ThemedText>
                  )}
                </View>
              );
            }
            return null;
          })}
        </View>
      )}

      {/* Reflection */}
      {reflection && (
        <View
          style={[
            styles.section,
            styles.reflectionSection,
            { backgroundColor: colors.ui },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="moon-outline" size={20} color="#7C3AED" />
            <ThemedText
              style={[styles.sectionTitle, styles.italic, { color: "#7C3AED" }]}
            >
              Reflection
            </ThemedText>
          </View>
          <ThemedText style={[styles.timestamp, { color: colors.tx3 }]}>
            {formatTime(reflection.created_at)}
          </ThemedText>
          {reflection.transcription && (
            <ThemedText style={[styles.transcription, { color: colors.tx }]}>
              {reflection.transcription}
            </ThemedText>
          )}
        </View>
      )}

      {/* Empty state */}
      {!intention && timeline.length === 0 && !reflection && (
        <View style={[styles.emptyState, { backgroundColor: colors.ui }]}>
          <Ionicons name="calendar-outline" size={48} color={colors.tx3} />
          <ThemedText style={[styles.emptyText, { color: colors.tx3 }]}>
            No entries yet for today
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.tx3 }]}>
            Switch to Plan mode to get started
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  intentionSection: {},
  timelineSection: {
    paddingTop: 8,
  },
  reflectionSection: {},
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  italic: {
    fontStyle: "italic",
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 8,
  },
  transcription: {
    fontSize: 15,
    lineHeight: 22,
  },
  captureItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  captureTime: {
    fontSize: 12,
    marginBottom: 6,
  },
  mediaItem: {
    marginBottom: 16,
  },
  mediaImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    marginTop: 8,
  },
  mediaCaption: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
  },
  emptyState: {
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
});
