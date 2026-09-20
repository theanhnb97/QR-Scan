/**
 * @format
 */

import React from 'react';

// Navigation is covered by the platform build; keep this smoke test focused on
// the root provider wiring so ESM navigation internals do not run in Jest.
jest.mock('../src/ui/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('../src/data/appContainer', () => ({
  settingsRepository: {
    getSettings: jest.fn().mockResolvedValue({ appLockEnabled: false, linkBehavior: 'in_app' }),
    setAppLockEnabled: jest.fn().mockResolvedValue(undefined),
    setLinkBehavior: jest.fn().mockResolvedValue(undefined),
  },
  biometricService: { authenticate: jest.fn().mockResolvedValue(true) },
}));

import App from '../App';

// Mock react-native-screens and safe-area-context for Jest testing
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({ children }: { children: (insets: any) => React.ReactNode }) => children(inset),
    useSafeAreaInsets: () => inset,
  };
});

test('exports the application root', () => {
  expect(App).toBeDefined();
});
