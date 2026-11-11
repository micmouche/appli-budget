/** Gabarit des 3 écrans d'onboarding : indicateur de progression, titre, contenu, pied. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export interface OnboardingShellProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Screen scroll={false} contentStyle={{ flex: 1 }}>
      <View style={styles.dots} accessibilityLabel={`Étape ${step} sur 3`}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= step ? theme.colors.brand : theme.colors.border,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
      <Animated.View entering={FadeInUp.duration(350)} style={{ flex: 1 }}>
        <Text
          variant="title1"
          accessibilityRole="header"
          style={{ marginBottom: subtitle ? 6 : theme.spacing[6] }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" color="textSecondary" style={{ marginBottom: theme.spacing[6] }}>
            {subtitle}
          </Text>
        ) : null}
        <View style={{ flex: 1 }}>{children}</View>
      </Animated.View>
      <View style={{ gap: theme.spacing[3], paddingTop: theme.spacing[4] }}>{footer}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6, marginBottom: 28, marginTop: 8 },
  dot: { height: 8, borderRadius: 4 },
});
