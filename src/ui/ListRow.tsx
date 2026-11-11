/** Ligne de liste : icône (ou pastille), titre, sous-titre, valeur ou chevron. */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor,
  left,
  right,
  onPress,
  chevron,
  destructive,
  last,
  accessibilityLabel,
}: ListRowProps): React.JSX.Element {
  const theme = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        {
          paddingVertical: theme.spacing[3],
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {left ??
        (icon ? (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: iconColor ? `${iconColor}1F` : theme.colors.surface2 },
            ]}
          >
            <Icon name={icon} size={20} color={iconColor ?? theme.colors.textSecondary} />
          </View>
        ) : null)}
      <View style={styles.text}>
        <Text variant="headline" color={destructive ? 'negative' : 'text'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="ChevronRight" size={20} color="textMuted" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});
