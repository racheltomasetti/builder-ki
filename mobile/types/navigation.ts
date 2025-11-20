import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';

// Stack navigator (root level with Auth and Main Tabs)
export type RootStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
};

// Bottom tab navigator (main authenticated screens)
export type MainTabsParamList = {
  PlanTrack: undefined;
  Capture: {
    focusMode?: boolean;
    timerId?: string;
    taskId?: string;
    taskName?: string;
  } | undefined;
  Community: undefined;
};

// Screen props types for each screen
export type PlanTrackScreenProps = BottomTabScreenProps<MainTabsParamList, 'PlanTrack'>;
export type CaptureScreenProps = BottomTabScreenProps<MainTabsParamList, 'Capture'>;
export type CommunityScreenProps = BottomTabScreenProps<MainTabsParamList, 'Community'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type MediaUploadScreenProps = {
  navigation: BottomTabNavigationProp<MainTabsParamList>;
};

// Navigation prop type (for using navigation.navigate())
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
