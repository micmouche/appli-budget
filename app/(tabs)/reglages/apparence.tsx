/** Apparence : thème, langue. */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { setLocale, type AppLocale } from '@/i18n';
import { useSettings, type ThemePreference } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';

export default function AppearanceScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const themePref = useSettings((s) => s.theme);
  const locale = useSettings((s) => s.locale);
  const set = useSettings((s) => s.set);
  return (
    <Screen>
      <SubScreenHeader title={t('settings.appearance')} />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="callout" color="textSecondary" style={{ marginBottom: theme.spacing[2] }}>
          {t('settings.theme')}
        </Text>
        <Segmented<ThemePreference>
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
          value={themePref}
          onChange={(v) => set('theme', v)}
        />
      </Card>
      <Card>
        <Text variant="callout" color="textSecondary" style={{ marginBottom: theme.spacing[2] }}>
          {t('settings.language')}
        </Text>
        <Segmented<AppLocale>
          options={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          value={locale}
          onChange={(v) => {
            set('locale', v);
            setLocale(v);
          }}
        />
      </Card>
    </Screen>
  );
}
