/** En-tête de page (référence) : menu ou retour à gauche, cloche à droite, petit libellé puis grand titre. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface PageHeaderProps {
  /** Petit libellé gris au-dessus du titre. */
  label?: string;
  title: string;
  /** Bouton retour rond vert devant le libellé (sous-écran). */
  back?: boolean;
  /** Icône menu à gauche (écran principal). */
  onMenu?: () => void;
  /** Cloche à droite avec compteur. */
  onBell?: () => void;
  bellCount?: number;
  /** Rouage des réglages à droite de la cloche. */
  onSettings?: () => void;
  right?: React.ReactNode;
}

export function PageHeader({
  label,
  title,
  back = false,
  onMenu,
  onBell,
  bellCount = 0,
  onSettings,
  right,
}: PageHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: theme.spacing[6] }}>
      {onMenu || onBell || onSettings || right ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[4],
          }}
        >
          {onMenu ? (
            <IconButton
              name="TextAlignStart"
              color="brand"
              size={28}
              accessibilityLabel={t('common.menu')}
              onPress={onMenu}
              style={{ marginLeft: -10 }}
            />
          ) : (
            <View />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {right}
            {onBell ? (
              <View>
                <IconButton
                  name="Bell"
                  color="brand"
                  size={26}
                  accessibilityLabel={t('common.notifications', { count: bellCount })}
                  onPress={onBell}
                />
                {bellCount > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: -2,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      paddingHorizontal: 4,
                      backgroundColor: theme.colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text variant="micro" style={{ color: '#FFFFFF', letterSpacing: 0 }}>
                      {bellCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            {onSettings ? (
              <IconButton
                name="Settings"
                color="brand"
                size={26}
                accessibilityLabel={t('tabs.settings')}
                onPress={onSettings}
                style={{ marginRight: -10, marginLeft: onBell ? 6 : 0 }}
              />
            ) : null}
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3] }}>
        {back ? (
          <PressableScale
            onPress={() => router.back()}
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: theme.colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: label ? 10 : 6,
            }}
          >
            <Icon name="ChevronLeft" color={theme.colors.onBrand} size={18} strokeWidth={2.5} />
          </PressableScale>
        ) : null}
        <View style={{ flex: 1 }}>
          {label ? (
            <Text variant="callout" color="textSecondary">
              {label}
            </Text>
          ) : null}
          <Text variant="title1" accessibilityRole="header">
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}
