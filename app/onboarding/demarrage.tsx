/** Onboarding 3/3 : seul ou en couple, démo ou départ à vide. */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { OnboardingShell } from '@/core/OnboardingShell';
import { setDemoMode } from '@/core/bootstrap';
import { getAppDb } from '@/db/client';
import { ensureHousehold } from '@/db/repositories';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { haptics } from '@/utils/haptics';

export default function OnboardingStart(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const patch = useSettings((s) => s.patch);
  const [couple, setCouple] = useState<'solo' | 'couple'>('solo');

  const finish = (demo: boolean): void => {
    const isCouple = couple === 'couple';
    patch({ couple: isCouple, onboardingDone: true });
    ensureHousehold(isCouple, [t('common.me'), t('budget.person2')], getAppDb());
    setDemoMode(demo);
    haptics.success();
    router.replace('/(tabs)');
  };

  return (
    <OnboardingShell
      step={3}
      title={t('onboarding.startTitle')}
      footer={
        <>
          <Button label={t('onboarding.demoButton')} onPress={() => finish(true)} icon="Sparkles" />
          <Button label={t('onboarding.emptyButton')} onPress={() => finish(false)} variant="secondary" />
          <Text variant="caption" color="textMuted" align="center">
            {t('onboarding.changeLater')}
          </Text>
        </>
      }
    >
      <View style={{ gap: theme.spacing[3] }}>
        <Text variant="callout" color="textSecondary">
          {t('onboarding.householdQuestion')}
        </Text>
        <Segmented
          options={[
            { value: 'solo', label: t('onboarding.householdSolo') },
            { value: 'couple', label: t('onboarding.householdCouple') },
          ]}
          value={couple}
          onChange={setCouple}
        />
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing[4] }}>
          {t('onboarding.demoHint')}
        </Text>
      </View>
    </OnboardingShell>
  );
}
