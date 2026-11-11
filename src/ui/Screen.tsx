/** Conteneur d'écran : fond, zones sûres, défilement optionnel, titre. */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { screenPadding } from '@/theme/tokens';

import { Text } from './Text';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  /** Pas de padding horizontal (listes pleine largeur). */
  edgeToEdge?: boolean;
  /** Réserve de l'espace en bas (FAB, barre d'onglets personnalisée). */
  bottomInset?: number;
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Le haut est déjà géré par un header natif. */
  withHeader?: boolean;
}

export function Screen({
  children,
  scroll = true,
  title,
  subtitle,
  headerRight,
  edgeToEdge = false,
  bottomInset = 0,
  keyboard = false,
  contentStyle,
  withHeader = false,
}: ScreenProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const paddingTop = withHeader ? theme.spacing[3] : insets.top + theme.spacing[2];
  const header =
    title || headerRight ? (
      <View
        style={[
          styles.header,
          { paddingHorizontal: edgeToEdge ? screenPadding : 0, marginBottom: theme.spacing[4] },
        ]}
      >
        <View style={styles.headerText}>
          {title ? (
            <Text variant="title1" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="callout" color="textSecondary" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight}
      </View>
    ) : null;

  const inner = (
    <View
      style={[
        {
          paddingTop,
          paddingHorizontal: edgeToEdge ? 0 : screenPadding,
          paddingBottom: insets.bottom + theme.spacing[6] + bottomInset,
        },
        contentStyle,
      ]}
    >
      {header}
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>{inner}</View>
  );

  if (!keyboard) return body;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerText: { flex: 1 },
});
