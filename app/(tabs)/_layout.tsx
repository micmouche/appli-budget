/** Barre d'onglets : Accueil · Budget · Épargne · Immo · Réglages. */
import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar, type TabBarProps } from '@/core/TabBar';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamilies } from '@/theme/typography';
import { Icon } from '@/ui/Icon';

export default function TabsLayout(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tab = (name: string, title: string, icon: string, activeIcon = icon) => (
    <Tabs.Screen
      key={name}
      name={name}
      options={{
        title,
        tabBarIcon: ({ color, focused }) => (
          <Icon
            name={focused ? activeIcon : icon}
            color={String(color ?? theme.colors.textMuted)}
            size={24}
            strokeWidth={focused ? 2.25 : 1.75}
          />
        ),
      }}
    />
  );
  return (
    <Tabs
      tabBar={(props) => <TabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 56 + Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8),
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontFamily: fontFamilies.bodyMedium, fontSize: 11, marginTop: 2 },
        tabBarAllowFontScaling: false,
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {tab('index', t('tabs.home'), 'House')}
      {tab('budget', t('tabs.budget'), 'Wallet')}
      {tab('epargne', t('tabs.savings'), 'PiggyBank')}
      {tab('immo', t('tabs.property'), 'Building')}
      <Tabs.Screen
        name="reglages"
        options={{ title: t('tabs.settings'), tabBarItemStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
