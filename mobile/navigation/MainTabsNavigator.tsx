import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  useColorScheme,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useThemeColors } from "../theme/colors";
import PlanTrackScreen from "../screens/PlanTrackScreen";
import CaptureScreen from "../screens/CaptureScreen";
import CommunityScreen from "../screens/CommunityScreen";
import type {
  MainTabsParamList,
  RootStackParamList,
} from "../types/navigation";

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Format current date as "Day of the week, Month Day, Year"
const getFormattedDate = (): string => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  return today.toLocaleDateString("en-US", options);
};

export default function MainTabsNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      initialRouteName="PlanTrack"
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tx3,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.ui3,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
          fontFamily: "Perpetua",
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.bg,
          borderBottomColor: colors.ui3,
          borderBottomWidth: 1,
          height: 110,
        },
        headerTitleStyle: {
          color: colors.tx,
          fontFamily: "Perpetua",
        },
        headerTitleContainerStyle: {
          paddingBottom: 8,
        },
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="PlanTrack"
        component={PlanTrackScreen}
        options={{
          tabBarLabel: "Plan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          // header title is current date
          headerTitle: () => (
            <Text
              style={{
                fontSize: 18,
                color: colors.tx,
                fontFamily: "Perpetua",
              }}
            >
              {getFormattedDate()}
            </Text>
          ),
          headerTitleStyle: {
            fontSize: 18,
            color: colors.tx,
            fontFamily: "Perpetua",
          },
          headerTitleContainerStyle: {
            paddingTop: 8,
            paddingBottom: 8,
          },
        }}
      />
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          tabBarLabel: "Daily Journal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="journal-outline" size={size} color={color} />
          ), // header title is current date
          headerTitle: () => (
            <Text
              style={{
                fontSize: 18,
                color: colors.tx,
                fontFamily: "Perpetua",
              }}
            >
              {getFormattedDate()}
            </Text>
          ),
          headerTitleStyle: {
            fontSize: 18,
            color: colors.tx,
            fontFamily: "Perpetua",
          },
          headerTitleContainerStyle: {
            paddingTop: 8,
            paddingBottom: 8,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={styles.settingsButton}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={28} color={colors.tx} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: "Community",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          headerTitle: "Connect",
          headerTitleStyle: {
            fontSize: 25,
            color: colors.tx,
            fontFamily: "Perpetua",
          },
          headerTitleContainerStyle: {
            paddingBottom: 8,
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    marginRight: 15,
    padding: 8,
  },
});
