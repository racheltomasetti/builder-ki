import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  useColorScheme,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useThemeColors } from "../theme/colors";
import DailyLogScreen from "../screens/DailyLogScreen";
import CaptureScreen from "../screens/CaptureScreen";
import MediaUploadScreen from "../screens/MediaUploadScreen";
import type {
  MainTabsParamList,
  RootStackParamList,
} from "../types/navigation";

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabsNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      initialRouteName="DailyLog"
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
        },
        headerTitleContainerStyle: {
          paddingBottom: 8,
        },
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="DailyLog"
        component={DailyLogScreen}
        options={{
          tabBarLabel: "Daily Log",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: "~ K·I ~",
          headerTitleStyle: {
            fontSize: 25,
            color: colors.tx,
          },
          headerTitleContainerStyle: {
            paddingBottom: 8,
          },
        }}
      />
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          tabBarLabel: "Capture",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
          headerTitle: () => <View />,
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
        name="MediaUpload"
        component={MediaUploadScreen}
        options={{
          tabBarLabel: "Upload",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="image-outline" size={size} color={color} />
          ),
          headerTitle: "~ K·I ~",
          headerTitleStyle: {
            fontSize: 25,
            color: colors.tx,
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
