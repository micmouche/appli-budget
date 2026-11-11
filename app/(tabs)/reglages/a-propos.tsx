/** À propos : version, confidentialité, CGU, contact, note. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  links?: { privacy?: string; terms?: string; support?: string };
};

export default function AboutScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const set = useSettings((s) => s.set);
  const open = (url?: string): void => {
    if (url) void Linking.openURL(url);
  };
  return (
    <Screen>
      <SubScreenHeader title={t('settings.about')} />
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}>
        <ListRow
          icon="ShieldCheck"
          title={t('settings.privacy')}
          chevron
          onPress={() => open(extra.links?.privacy)}
        />
        <ListRow
          icon="FileText"
          title={t('settings.terms')}
          chevron
          onPress={() => open(extra.links?.terms)}
        />
        <ListRow
          icon="Mail"
          title={t('settings.contact')}
          chevron
          onPress={() => open(extra.links?.support)}
        />
        <ListRow
          icon="Star"
          title={t('settings.rate')}
          chevron
          last
          onPress={() => open(extra.links?.support)}
        />
      </Card>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        <ListRow
          icon="RotateCcw"
          title={t('settings.redoOnboarding')}
          last
          onPress={() => {
            set('onboardingDone', false);
            router.replace('/onboarding');
          }}
        />
      </Card>
      <Text variant="caption" color="textMuted" align="center" style={{ marginTop: theme.spacing[6] }}>
        {t('app.name')} · {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
      <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 4 }}>
        {t('common.disclaimer')}
      </Text>
    </Screen>
  );
}
