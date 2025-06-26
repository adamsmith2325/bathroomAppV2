// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Map: undefined;
  Add: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  // Tell the stack that MainTabs is actually a child navigator:
  MainTabs: NavigatorScreenParams<RootTabParamList>;
};
