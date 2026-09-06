import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { CrewId } from './logic/types';

export type TabParamList = {
  Kotatsu: undefined;
  Rooms: undefined;
  Crew: undefined;
  Keepsakes: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Room: { id: CrewId };
  Paywall: { fromOnboarding?: boolean; reason?: 'limit' | 'table' | 'dm' | 'checkins' } | undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootNav = NativeStackNavigationProp<RootStackParamList>;
