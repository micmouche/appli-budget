/** Barre d'onglets : Accueil · Budget · Épargne · Immo · Réglages. */
import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fontFamilies } from '@/theme/typography';
import { Icon } from '@/ui/Icon';

export default function TabsLayout(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fontFamilies.bodyMedium, fontSize: 11 },
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {tab('index', t('tabs.home'), 'House')}
      {tab('budget', t('tabs.budget'), 'Wallet')}
      {tab('epargne', t('tabs.savings'), 'PiggyBank')}
      {tab('immo', t('tabs.property'), 'Building')}
      {tab('reglages', t('tabs.settings'), 'Settings')}
    </Tabs>
  );
}
