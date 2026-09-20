import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/ui/navigation/RootNavigator';
import { AppLockGate, AppSecurityProvider } from './src/ui/state/AppSecurityContext';
import { LocaleProvider } from './src/ui/i18n';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AppSecurityProvider>
          <RootNavigator />
          <AppLockGate />
        </AppSecurityProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

export default App;
