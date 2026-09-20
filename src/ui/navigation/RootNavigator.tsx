import React, { useState } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScanScreen } from '../screens/ScanScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { colors } from '../theme/colors';
import { SettingsModal } from '../screens/SettingsModal';
import { useLocale } from '../i18n';
import { APP_ICON_SIZES, AppIcon } from '../components/AppIcon';

export type RootTabParamList = {
  Scan: { importAuthenticator?: number } | undefined;
  History: undefined;
  Auth: { openExport?: number; openAdd?: number } | undefined;
  Create: { openHistory?: number } | undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { t } = useLocale();

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.background,
          card: theme.tabBarBackground,
          text: theme.text,
          border: theme.border,
          primary: theme.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.background,
          card: theme.tabBarBackground,
          text: theme.text,
          border: theme.border,
          primary: theme.primary,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        initialRouteName="Scan"
        screenOptions={({ navigation, route }) => ({
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: theme.tabBarBackground,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopColor: theme.border,
          },
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          headerRight: () => (
            <View style={styles.headerActions}>
              {route.name === 'Create' ? (
                <Pressable onPress={() => navigation.navigate('Create', { openHistory: Date.now() })} accessibilityRole="button" accessibilityLabel={t('generatedHistory')} style={styles.headerActionButton}>
                  <AppIcon name="history" color={theme.text} size={APP_ICON_SIZES.header} />
                </Pressable>
              ) : null}
              {route.name === 'Auth' ? (
                <Pressable onPress={() => navigation.navigate('Auth', { openAdd: Date.now() })} accessibilityRole="button" accessibilityLabel={t('addAccount')} style={styles.headerActionButton}>
                  <AppIcon name="plus" color={theme.text} size={APP_ICON_SIZES.header} />
                </Pressable>
              ) : null}
              <Pressable onPress={() => setSettingsVisible(true)} accessibilityRole="button" accessibilityLabel={t('settings')} style={styles.headerActionButton}>
                <AppIcon name="settings" color={theme.text} size={APP_ICON_SIZES.header} />
              </Pressable>
            </View>
          ),
        })}
      >
        <Tab.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            title: t('scan'),
            tabBarAccessibilityLabel: 'Scan Tab',
            tabBarIcon: ({ color }) => <AppIcon name="scan" color={color} size={APP_ICON_SIZES.tab} />,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={({ navigation }) => ({
            title: t('history'),
            headerLeft: () => <HeaderBack onPress={() => navigation.navigate('Scan')} label={t('backToScan')} color={theme.primary} />,
            tabBarAccessibilityLabel: 'History Tab',
            tabBarIcon: ({ color }) => <AppIcon name="history" color={color} size={APP_ICON_SIZES.tab} />,
          })}
        />
        <Tab.Screen
          name="Auth"
          component={AuthScreen}
          options={({ navigation }) => ({
            title: t('authenticator'),
            headerLeft: () => <HeaderBack onPress={() => navigation.navigate('Scan')} label={t('backToScan')} color={theme.primary} />,
            tabBarAccessibilityLabel: 'Authenticator Tab',
            tabBarIcon: ({ color }) => <AppIcon name="authenticator" color={color} size={APP_ICON_SIZES.tab} />,
          })}
        />
        <Tab.Screen
          name="Create"
          component={CreateScreen}
          options={({ navigation }) => ({
            title: t('create'),
            headerLeft: () => <HeaderBack onPress={() => navigation.navigate('Scan')} label={t('backToScan')} color={theme.primary} />,
            tabBarAccessibilityLabel: 'Create Tab',
            tabBarIcon: ({ color }) => <AppIcon name="create" color={color} size={APP_ICON_SIZES.tab} />,
          })}
        />
      </Tab.Navigator>
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </NavigationContainer>
  );
};

const HeaderBack: React.FC<{ onPress: () => void; label: string; color: string }> = ({ onPress, label, color }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={styles.headerBack}>
    <AppIcon name="back" color={color} size={APP_ICON_SIZES.header} />
  </Pressable>
);

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', marginRight: 6 },
  headerActionButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerBack: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center' },
});
