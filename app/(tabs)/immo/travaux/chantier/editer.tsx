/** Chantier : création / édition. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { addDays } from 'date-fns';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { createProject, deleteProject, getProject, listProperties, updateProject } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function ProjectEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getProject(id)), [id, isNew]);
  const properties = useQuery(() => listProperties(), []);
  const [name, setName] = useState(existing?.name ?? '');
  const [propertyId, setPropertyId] = useState<string | null>(existing?.propertyId ?? null);
  const [budget, setBudget] = useState<number | null>(existing?.budgetCents ?? null);
  const [startDate, setStartDate] = useState(existing?.startDate ?? toIsoDate(new Date()));
  const [endDate, setEndDate] = useState(() => existing?.endDate ?? toIsoDate(addDays(new Date(), 90)));
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 3);

  const save = (): void => {
    if (!name.trim()) {
      haptics.error();
      return;
    }
    const input = { name, propertyId, budgetCents: budget ?? 0, startDate, endDate, colorIndex };
    if (isNew) {
      const created = createProject(input);
      haptics.success();
      router.replace({ pathname: '/(tabs)/immo/travaux/chantier/[id]', params: { id: created.id } });
      return;
    }
    updateProject(id, input);
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
          deleteProject(id);
          router.dismissTo('/(tabs)/immo/travaux');
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('works.addProject') : t('works.editProject')} />
      <Card>
        <FormField label={t('works.projectName')}>
          <Input value={name} onChangeText={setName} placeholder="Rénovation maison" autoFocus={isNew} />
        </FormField>
        <FormField label={t('works.budget')}>
          <CurrencyInput valueCents={budget} onChangeCents={setBudget} />
        </FormField>
        {properties.length > 0 ? (
          <FormField label={t('works.linkedProperty')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip
                label={t('works.noLinkedProperty')}
                selected={propertyId === null}
                onPress={() => setPropertyId(null)}
              />
              {properties.map((p) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  selected={propertyId === p.id}
                  onPress={() => setPropertyId(p.id)}
                />
              ))}
            </View>
          </FormField>
        ) : null}
        <FormField label={t('works.startDate')}>
          <DateField value={startDate} onChange={setStartDate} />
        </FormField>
        <FormField label={t('works.endDate')}>
          <DateField value={endDate} onChange={setEndDate} />
        </FormField>
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
