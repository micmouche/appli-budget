/** Sécurité : verrouillage biométrique. */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function SecurityScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const lockEnabled = useSettings((s) => s.lockEnabled);
  const set = useSettings((s) => s.set);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hw, enrolled]) => setAvailable(hw && enrolled))
      .catch(() => setAvailable(false));
  }, []);

  const toggle = async (value: boolean): Promise<void> => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: t('lock.prompt') });
      if (!result.success) return;
    }
    set('lockEnabled', value);
  };

  return (
    <Screen>
      <SubScreenHeader title={t('settings.security')} />
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        <ListRow
          icon="ScanFace"
          title={t('settings.biometricLock')}
          last
          right={
            <Switch
              value={lockEnabled}
              disabled={available === false}
              onValueChange={(v) => void toggle(v)}
              trackColor={{ true: theme.colors.brand }}
              accessibilityLabel={t('settings.biometricLock')}
            />
          }
        />
      </Card>
      {available === false ? (
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing[3] }}>
          {t('settings.biometricUnavailable')}
        </Text>
      ) : null}
    </Screen>
  );
}
