/** Barre d'onglets sombre (référence) avec grand bouton « + » central surélevé. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { fontFamilies } from '@/theme/typography';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Text } from '@/ui/Text';

export const TAB_BAR_HEIGHT = 64;
const PLUS = 76;

export const TAB_ICONS: Record<string, string> = {
  index: 'House',
  budget: 'ChartPie',
  epargne: 'PiggyBank',
  immo: 'Building',
  reglages: 'CircleUserRound',
};

interface TabRoute {
  key: string;
  name: string;
}
/** Sous-ensemble des props de barre d'onglets fournies par expo-router. */
export interface TabBarProps {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string; href?: string | null } } | undefined>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function TabBar({ state, descriptors, navigation }: TabBarProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const bottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10);
  const routes = state.routes.filter((r) => descriptors[r.key]?.options.href !== null);
  const middle = Math.ceil(routes.length / 2);
  const item = (route: (typeof routes)[number]): React.JSX.Element => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const label = typeof options?.title === 'string' ? options.title : route.name;
    return (
      <PressableScale
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        haptic="selection"
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 10 }}
      >
        <Icon
          name={TAB_ICONS[route.name] ?? 'Circle'}
          color="#FFFFFF"
          size={24}
          strokeWidth={focused ? 2.4 : 1.8}
          fill={focused ? '#FFFFFF' : 'none'}
        />
        <Text
          variant="caption"
          style={{
            color: '#FFFFFF',
            fontFamily: focused ? fontFamilies.bodySemi : fontFamilies.body,
            opacity: focused ? 1 : 0.85,
          }}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </PressableScale>
    );
  };
  return (
    <View
      style={{
        backgroundColor: theme.colors.navBar,
        paddingBottom: bottom,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
      }}
    >
      <View style={{ flexDirection: 'row', height: TAB_BAR_HEIGHT, alignItems: 'stretch' }}>
        {routes.slice(0, middle).map(item)}
        <View style={{ width: PLUS + 12 }} />
        {routes.slice(middle).map(item)}
      </View>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 0, right: 0, top: -PLUS / 2 - 6, alignItems: 'center' }}
      >
        <View
          style={{
            width: PLUS + 14,
            height: PLUS + 14,
            borderRadius: (PLUS + 14) / 2,
            backgroundColor: theme.colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PressableScale
            onPress={() => router.push('/saisie-rapide')}
            haptic="light"
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel={t('home.quickAdd')}
            style={{
              width: PLUS,
              height: PLUS,
              borderRadius: PLUS / 2,
              backgroundColor: theme.colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: theme.colors.navBar,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Icon name="Plus" color="#FFFFFF" size={40} strokeWidth={3} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
