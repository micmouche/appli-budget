/** Onboarding 1/3 : promesse. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { OnboardingShell } from '@/core/OnboardingShell';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

export default function OnboardingWelcome(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const bullets: { icon: string; text: string }[] = [
    { icon: 'UserRoundX', text: t('onboarding.welcomeBullet1') },
    { icon: 'Smartphone', text: t('onboarding.welcomeBullet2') },
    { icon: 'LayoutGrid', text: t('onboarding.welcomeBullet3') },
  ];
  return (
    <OnboardingShell
      step={1}
      title={t('onboarding.welcomeTitle')}
      footer={<Button label={t('common.start')} onPress={() => router.push('/onboarding/usage')} />}
    >
      <View style={{ gap: theme.spacing[4], marginTop: theme.spacing[2] }}>
        {bullets.map((b) => (
          <View key={b.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: theme.colors.brandSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={b.icon} color="brand" size={22} />
            </View>
            <Text variant="body" style={{ flex: 1 }}>
              {b.text}
            </Text>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}
