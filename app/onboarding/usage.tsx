/** Onboarding 2/3 : usage principal (multi-choix). */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { OnboardingShell } from '@/core/OnboardingShell';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import type { ModuleId } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

const MODULES: { id: ModuleId; icon: string; key: string }[] = [
  { id: 'budget', icon: 'Wallet', key: 'budget' },
  { id: 'savings', icon: 'PiggyBank', key: 'savings' },
  { id: 'property', icon: 'KeyRound', key: 'property' },
  { id: 'rental', icon: 'Building', key: 'rental' },
  { id: 'works', icon: 'Hammer', key: 'works' },
];

export default function OnboardingUsage(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const saved = useSettings((s) => s.modules);
  const set = useSettings((s) => s.set);
  const [selected, setSelected] = useState<ModuleId[]>(saved);

  const toggle = (id: ModuleId): void => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]));
  };

  return (
    <OnboardingShell
      step={2}
      title={t('onboarding.usageTitle')}
      subtitle={t('onboarding.usageSubtitle')}
      footer={
        <Button
          label={t('common.continue')}
          disabled={selected.length === 0}
          onPress={() => {
            set('modules', selected);
            set('homeCards', ['savings', 'topCategory', ...(['rental', 'works', 'property'] as const).filter((m) => selected.includes(m))]);
            router.push('/onboarding/demarrage');
          }}
        />
      }
    >
      <View style={{ gap: theme.spacing[3] }}>
        {MODULES.map((m) => {
          const on = selected.includes(m.id);
          return (
            <Card
              key={m.id}
              onPress={() => toggle(m.id)}
              style={{
                borderColor: on ? theme.module[m.id] : theme.colors.border,
                borderWidth: on ? 1.5 : 1,
              }}
              accessibilityLabel={t(`onboarding.usage.${m.key}`)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${theme.module[m.id]}1F`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={m.icon} color={theme.module[m.id]} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headline">{t(`onboarding.usage.${m.key}`)}</Text>
                  <Text variant="caption" color="textSecondary">
                    {t(`onboarding.usage.${m.key}Hint`)}
                  </Text>
                </View>
                <Icon
                  name={on ? 'CircleCheck' : 'Circle'}
                  color={on ? theme.colors.brand : theme.colors.textMuted}
                  size={24}
                />
              </View>
            </Card>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
