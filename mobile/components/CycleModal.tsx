import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useThemeColors } from "../theme/colors";
import { supabase } from "../lib/supabase";
import {
  getCurrentCycleInfo,
  startPeriod,
  endPeriod,
  getRecentPeriods,
  calculateCycleLength,
  calculatePeriodDuration,
  type CyclePeriod,
  type CycleInfo,
} from "../lib/cycleApi";
import { ThemedText } from "./ThemedText";

interface CycleModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onCycleUpdate: () => void; // Callback to refresh cycle info in parent
}

const PHASE_LABELS = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
};

export default function CycleModal({
  visible,
  onClose,
  userId,
  onCycleUpdate,
}: CycleModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  const [loading, setLoading] = useState(true);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [recentPeriods, setRecentPeriods] = useState<CyclePeriod[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLogLastPeriod, setShowLogLastPeriod] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      loadCycleData();
    } else {
      // Reset state when modal closes
      setShowLogLastPeriod(false);
      setShowDatePicker(false);
    }
  }, [visible, userId]);

  const loadCycleData = async () => {
    try {
      setLoading(true);
      console.log("Loading cycle data for user:", userId);
      const [info, periods] = await Promise.all([
        getCurrentCycleInfo(userId),
        getRecentPeriods(userId, 4),
      ]);
      console.log("Cycle info loaded:", info);
      console.log("Recent periods loaded:", periods);

      // Deduplicate periods by ID (in case of duplicates)
      const uniquePeriods = periods.filter(
        (period, index, self) =>
          index === self.findIndex((p) => p.id === period.id)
      );
      console.log("Unique periods:", uniquePeriods);

      setCycleInfo(info);
      setRecentPeriods(uniquePeriods);
    } catch (error) {
      console.error("Error loading cycle data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogPeriod = async () => {
    try {
      setActionLoading(true);
      const today = getTodayDate();

      // If there's a current cycle, end it (day before new period starts)
      if (cycleInfo?.currentPeriod) {
        // End the current cycle on the day before the new period
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = dateToString(yesterday);

        const { error: endError } = await supabase
          .from("cycle_periods")
          .update({ end_date: yesterdayStr })
          .eq("id", cycleInfo.currentPeriod.id);

        if (endError) throw endError;
      }

      // Start new cycle today
      const { error: startError } = await supabase
        .from("cycle_periods")
        .insert({
          user_id: userId,
          start_date: today,
          end_date: null,
        });

      if (startError) throw startError;

      Alert.alert("Success", "New cycle started!");
      await loadCycleData();
      onCycleUpdate();
    } catch (error: any) {
      console.error("Error logging period:", error);
      Alert.alert("Error", error.message || "Failed to log period");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    // Parse date string as local date to avoid timezone issues
    // dateString format: "YYYY-MM-DD"
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDateLong = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const dateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return dateToString(today);
  };

  const handleLogLastPeriod = async () => {
    try {
      setActionLoading(true);

      // Create a new date in local timezone to avoid UTC conversion issues
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();

      const localStartDate = new Date(year, month, day);
      const dateStr = dateToString(localStartDate);

      console.log("Logging cycle start:", dateStr);

      // Insert the cycle start date with NO end date (cycle is ongoing)
      const { error } = await supabase.from("cycle_periods").insert({
        user_id: userId,
        start_date: dateStr,
        end_date: null, // Cycle is ongoing, no end date
      });

      if (error) throw error;

      Alert.alert(
        "Success",
        "Last period logged! Your cycle day is now calculated from this date."
      );
      setShowLogLastPeriod(false);
      await loadCycleData();
      onCycleUpdate();
    } catch (error: any) {
      console.error("Error logging last period:", error);
      Alert.alert("Error", error.message || "Failed to log last period");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.ui }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.tx }]}>
              CYCLE TRACKER
            </ThemedText>
            {/* <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.tx2} />
            </TouchableOpacity> */}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
            >
              {/* Current Status */}
              <View style={styles.section}>
                <ThemedText style={[styles.sectionLabel, { color: colors.tx2 }]}>
                  Current Status
                </ThemedText>
                {cycleInfo?.cycleDay ? (
                  <ThemedText style={[styles.statusText, { color: colors.tx }]}>
                    Day {cycleInfo.cycleDay} • {PHASE_LABELS[
                      cycleInfo.cyclePhase as keyof typeof PHASE_LABELS
                    ] || "Unknown"}
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.statusText, { color: colors.tx2 }]}>
                    No cycle data yet
                  </ThemedText>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.section}>
                {/* Log Period Button - Always shown if there's cycle data */}
                {cycleInfo?.cycleDay !== null && (
                  <TouchableOpacity
                    onPress={handleLogPeriod}
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.accent },
                    ]}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color={colors.bg} />
                    ) : (
                      <>
                        <Ionicons name="calendar" size={24} color={colors.bg} />
                        <ThemedText
                          style={[
                            styles.actionButtonText,
                            { color: colors.bg },
                          ]}
                        >
                          Log Period
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Log Last Period Button - Only show if NO cycle data yet */}
                {cycleInfo?.cycleDay === null && recentPeriods.length === 0 && (
                  <TouchableOpacity
                    onPress={() => setShowLogLastPeriod(!showLogLastPeriod)}
                    style={[
                      styles.secondaryButton,
                      { borderColor: colors.accent2 },
                    ]}
                    disabled={actionLoading}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.accent2}
                    />
                    <ThemedText
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.accent2 },
                      ]}
                    >
                      Log Last Period Start
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Log Last Period Form - Only show if NO periods logged yet */}
              {showLogLastPeriod && recentPeriods.length === 0 && (
                <View
                  style={[
                    styles.logPastPeriodSection,
                    { backgroundColor: colors.ui2 },
                  ]}
                >
                  <ThemedText style={[styles.sectionLabel, { color: colors.tx2 }]}>
                    When did your last period start?
                  </ThemedText>
                  <ThemedText style={[styles.helperText, { color: colors.tx2 }]}>
                    This will set your cycle day tracker. Use "Start Period" for
                    future cycles.
                  </ThemedText>

                  {/* Date Selection */}
                  <View style={styles.datePickerRow}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={[
                        styles.dateButton,
                        { backgroundColor: colors.ui },
                      ]}
                    >
                      <ThemedText
                        style={[styles.dateButtonText, { color: colors.tx }]}
                      >
                        {formatDateLong(selectedDate)}
                      </ThemedText>
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={colors.accent2}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.logPastPeriodActions}>
                    <TouchableOpacity
                      onPress={() => setShowLogLastPeriod(false)}
                      style={[
                        styles.cancelButton,
                        { backgroundColor: colors.ui3 },
                      ]}
                    >
                      <ThemedText
                        style={[styles.cancelButtonText, { color: colors.tx2 }]}
                      >
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleLogLastPeriod}
                      style={[
                        styles.confirmButton,
                        { backgroundColor: colors.accent },
                      ]}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color={colors.bg} />
                      ) : (
                        <ThemedText
                          style={[
                            styles.confirmButtonText,
                            { color: colors.bg },
                          ]}
                        >
                          Log Period
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    // On Android, picker closes after selection
                    if (Platform.OS === "android") {
                      setShowDatePicker(false);
                    }
                    if (event.type === "set" && date) {
                      setSelectedDate(date);
                    }
                  }}
                  onTouchCancel={() => setShowDatePicker(false)}
                  maximumDate={new Date()}
                />
              )}

              {/* Recent Cycles History */}
              {recentPeriods.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={[styles.sectionLabel, { color: colors.tx2 }]}>
                    Recent Cycles
                  </ThemedText>
                  <View style={styles.historyList}>
                    {recentPeriods.map((period, index) => {
                      const cycleLength =
                        index < recentPeriods.length - 1
                          ? calculateCycleLength(
                              period.start_date,
                              recentPeriods[index + 1].start_date
                            )
                          : null;

                      // For the most recent cycle (index 0), show as ongoing
                      const isCurrentCycle = index === 0;

                      return (
                        <View
                          key={period.id}
                          style={[
                            styles.historyItem,
                            { borderBottomColor: colors.ui3 },
                          ]}
                        >
                          <View style={styles.historyItemContent}>
                            <ThemedText
                              style={[styles.historyDate, { color: colors.tx }]}
                            >
                              {period.start_date && formatDate(period.start_date)}
                              {period.end_date
                                ? ` - ${formatDate(period.end_date)}`
                                : " - Present"}
                            </ThemedText>
                            <View style={styles.historyMeta}>
                              {cycleLength && !isCurrentCycle ? (
                                <ThemedText
                                  style={[
                                    styles.historyMetaText,
                                    { color: colors.tx2 },
                                  ]}
                                >
                                  {cycleLength} days
                                </ThemedText>
                              ) : null}
                              {isCurrentCycle ? (
                                <ThemedText
                                  style={[
                                    styles.historyMetaText,
                                    { color: colors.accent },
                                  ]}
                                >
                                  CURRENT CYCLE
                                </ThemedText>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeActionButton, { backgroundColor: colors.ui3 }]}
          >
            <ThemedText style={[styles.closeActionText, { color: colors.tx }]}>
              Close
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContentContainer: {
    paddingBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  logPastPeriodSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  datePickerRow: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 15,
  },
  logPastPeriodActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  historyItemContent: {
    gap: 4,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "500",
  },
  historyMeta: {
    flexDirection: "row",
    gap: 12,
  },
  historyMetaText: {
    fontSize: 14,
  },
  closeActionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  closeActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
