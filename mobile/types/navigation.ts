import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Stack navigator (root level with Auth and Main Tabs)
export type RootStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
};

// Bottom tab navigator (main authenticated screens)
export type MainTabsParamList = {
  DailyLog: undefined;
  Capture: undefined;
  MediaUpload: undefined;
};

// Screen props types for each screen
export type DailyLogScreenProps = BottomTabScreenProps<MainTabsParamList, 'DailyLog'>;
export type CaptureScreenProps = BottomTabScreenProps<MainTabsParamList, 'Capture'>;
export type MediaUploadScreenProps = BottomTabScreenProps<MainTabsParamList, 'MediaUpload'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// Navigation prop type (for using navigation.navigate())
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
