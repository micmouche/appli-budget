/**
 * Verrouillage biométrique : écran opaque au lancement et au retour de l'arrière-plan
 * (après 30 s) si l'option est activée. Si la biométrie échoue, on reste verrouillé.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

const RELOCK_AFTER_MS = 30_000;

export function LockGate(): React.JSX.Element | null {
  const lockEnabled = useSettings((s) => s.lockEnabled);
  const [locked, setLocked] = useState(lockEnabled);
  const backgroundedAt = useRef<number | null>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  const unlock = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('lock.prompt'),
        cancelLabel: t('common.cancel'),
      });
      if (result.success) setLocked(false);
    } catch {
      /* reste verrouillé */
    }
  }, [t]);

  useEffect(() => {
    if (!lockEnabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = backgroundedAt.current ?? Date.now();
      } else if (state === 'active') {
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (away > RELOCK_AFTER_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [lockEnabled]);

  useEffect(() => {
    if (!(locked && lockEnabled)) return;
    const timer = setTimeout(() => void unlock(), 0);
    return () => clearTimeout(timer);
  }, [locked, lockEnabled, unlock]);

  if (!locked || !lockEnabled) return null;
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: theme.colors.bg }]}
      accessibilityViewIsModal
    >
      <Icon name="LockKeyhole" size={40} color="brand" />
      <Text variant="title2" style={{ marginTop: 16 }}>
        {t('lock.title')}
      </Text>
      <Button
        label={t('lock.unlock')}
        onPress={() => void unlock()}
        icon="ScanFace"
        style={{ marginTop: 24, minWidth: 200 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, zIndex: 100 },
});
