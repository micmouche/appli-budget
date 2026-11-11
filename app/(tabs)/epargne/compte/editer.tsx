/** Compte d'épargne : création (avec solde de départ) ou édition. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import {
  createSavingsAccount,
  deleteSavingsAccount,
  getSavingsAccount,
  updateSavingsAccount,
} from '@/db/repositories';
import { SAVINGS_TYPES, type SavingsType } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { defaultsForType } from '@/features/savings/logic';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input, NumberInput } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { haptics } from '@/utils/haptics';

import { iconForType } from '../index';

export default function SavingsAccountEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getSavingsAccount(id)), [id, isNew]);

  const [type, setType] = useState<SavingsType>(existing?.type ?? 'livretA');
  const [name, setName] = useState(existing?.name ?? t('savings.types.livretA'));
  const [rate, setRate] = useState<number | null>(
    existing
      ? existing.rateX100 === null
        ? null
        : existing.rateX100 / 100
      : defaultsForType('livretA').rateX100! / 100,
  );
  const [ceiling, setCeiling] = useState<number | null>(
    existing?.ceilingCents ?? defaultsForType('livretA').ceilingCents,
  );
  const [opening, setOpening] = useState<number | null>(null);
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 2);

  const chooseType = (next: SavingsType): void => {
    setType(next);
    const d = defaultsForType(next);
    setRate(d.rateX100 === null ? null : d.rateX100 / 100);
    setCeiling(d.ceilingCents);
    if (isNew && (name === '' || SAVINGS_TYPES.some((x) => t(`savings.types.${x}`) === name)))
      setName(t(`savings.types.${next}`));
  };

  const save = (): void => {
    if (!name.trim()) {
      haptics.error();
      return;
    }
    const input = {
      name,
      type,
      rateX100: rate === null ? null : Math.round(rate * 100),
      ceilingCents: ceiling && ceiling > 0 ? ceiling : null,
      colorIndex,
    };
    if (isNew) createSavingsAccount(input, opening ?? 0);
    else updateSavingsAccount(id, input);
    haptics.success();
    router.back();
  };

  const remove = (): void => {
    Alert.alert(t('common.confirmDeleteTitle'), t('common.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteSavingsAccount(id);
          router.dismissTo('/(tabs)/epargne');
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('savings.addAccount') : t('savings.editAccount')} />
      <Card>
        <FormField label={t('savings.accountType')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SAVINGS_TYPES.map((x) => (
              <Chip
                key={x}
                label={t(`savings.types.${x}`)}
                icon={iconForType(x)}
                selected={type === x}
                onPress={() => chooseType(x)}
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('savings.accountName')}>
          <Input value={name} onChangeText={setName} />
        </FormField>
        <FormField label={t('savings.rate')}>
          <NumberInput value={rate} onChange={setRate} suffix="%" placeholder="—" />
        </FormField>
        <FormField label={t('savings.ceiling')} hint={t('savings.noCeiling')}>
          <CurrencyInput valueCents={ceiling} onChangeCents={setCeiling} placeholder="—" />
        </FormField>
        {isNew ? (
          <FormField label={t('savings.openingBalance')}>
            <CurrencyInput valueCents={opening} onChangeCents={setOpening} />
          </FormField>
        ) : null}
        <FormField label={t('budget.categoryColor')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {theme.chart.map((c, i) => (
              <Chip
                key={c}
                label=" "
                color={c}
                selected={i === colorIndex}
                onPress={() => setColorIndex(i)}
              />
            ))}
          </View>
        </FormField>
        <Button label={t('common.save')} onPress={save} />
        {!isNew ? (
          <Button
            label={t('common.delete')}
            variant="destructive"
            onPress={remove}
            style={{ marginTop: theme.spacing[2] }}
          />
        ) : null}
      </Card>
    </Screen>
  );
}
