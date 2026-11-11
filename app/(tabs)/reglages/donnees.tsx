/** Données : export/import JSON, démo, effacement. */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Switch } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { setDemoMode } from '@/core/bootstrap';
import { createBackup, parseBackup, restoreBackup } from '@/db/backup';
import { clearDataTables, getDb } from '@/db/client';
import { ensureDefaultCategories, ensureHousehold } from '@/db/repositories';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { showToast } from '@/ui/Toast';
import { haptics } from '@/utils/haptics';
import { shareText } from '@/utils/share';

export default function DataScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const demoMode = useSettings((s) => s.demoMode);
  const couple = useSettings((s) => s.couple);
  const set = useSettings((s) => s.set);
  const [busy, setBusy] = useState(false);

  const exportJson = async (): Promise<void> => {
    setBusy(true);
    try {
      const backup = createBackup();
      const date = backup.exportedAt.slice(0, 10);
      await shareText(
        `pecule-sauvegarde-${date}.json`,
        JSON.stringify(backup, null, 2),
        'application/json',
        t('export.shareTitle'),
      );
      set('lastExportAt', backup.exportedAt);
    } catch {
      showToast(t('common.error'), { icon: 'CircleExclamationPoint' });
    } finally {
      setBusy(false);
    }
  };

  const importJson = async (): Promise<void> => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const text = await new File(picked.assets[0].uri).text();
    const backup = parseBackup(text);
    if (!backup) {
      showToast(t('settings.importInvalid'), { icon: 'CircleExclamationPoint' });
      return;
    }
    Alert.alert(
      t('settings.importConfirmTitle'),
      t('settings.importConfirmMessage', {
        expenses: backup.data.expenses.length,
        categories: backup.data.categories.length,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: () => {
            restoreBackup(backup);
            haptics.success();
            showToast(t('settings.importDone'));
          },
        },
      ],
    );
  };

  const eraseAll = (): void => {
    Alert.alert(t('settings.eraseAll'), t('settings.eraseConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          clearDataTables(getDb());
          ensureDefaultCategories();
          ensureHousehold(couple, [t('common.me'), t('budget.person2')]);
          haptics.warning();
          showToast(t('settings.erased'));
        },
      },
    ]);
  };

  return (
    <Screen>
      <SubScreenHeader title={t('settings.data')} />
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}>
        <ListRow icon="FileDown" title={t('settings.exportJson')} chevron onPress={() => void exportJson()} />
        <ListRow
          icon="FileUp"
          title={t('settings.importJson')}
          chevron
          last
          onPress={() => void importJson()}
        />
      </Card>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}>
        <ListRow
          icon="FlaskConical"
          title={t('settings.demoMode')}
          subtitle={t('settings.demoModeHint')}
          last
          right={
            <Switch
              value={demoMode}
              onValueChange={(v) => setDemoMode(v)}
              trackColor={{ true: theme.colors.brand }}
              accessibilityLabel={t('settings.demoMode')}
            />
          }
        />
      </Card>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        <ListRow
          icon="Trash"
          iconColor={theme.colors.negative}
          title={t('settings.eraseAll')}
          destructive
          last
          onPress={busy ? undefined : eraseAll}
        />
      </Card>
    </Screen>
  );
}
