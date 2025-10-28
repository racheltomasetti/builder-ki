import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the param list for our stack navigator
export type RootStackParamList = {
  Capture: undefined;
  Settings: undefined;
};

// Screen props types for each screen
export type CaptureScreenProps = NativeStackScreenProps<RootStackParamList, 'Capture'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// Navigation prop type (for using navigation.navigate())
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
