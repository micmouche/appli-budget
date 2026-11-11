/** Catégorie : création ou édition (nom, icône, couleur, enveloppe, suppression). */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { CATEGORY_ICON_CHOICES, OTHER_CATEGORY_ID } from '@/db/defaultCategories';
import {
  categoryLabel,
  countExpensesInCategory,
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Screen } from '@/ui/Screen';
import { haptics } from '@/utils/haptics';

export default function CategoryEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getCategory(id)), [id, isNew]);

  const [name, setName] = useState(existing ? (existing.name ?? categoryLabel(existing)) : '');
  const [icon, setIcon] = useState<string>(existing?.icon ?? 'Tag');
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [budgetCents, setBudgetCents] = useState<number | null>(existing?.budgetCents ?? null);

  const save = (): void => {
    if (!name.trim()) {
      haptics.error();
      return;
    }
    if (isNew) {
      const created = createCategory({ name, icon, colorIndex });
      if (budgetCents) updateCategory(created.id, { budgetCents });
    } else {
      updateCategory(id, {
        name: existing?.nameKey && name === categoryLabel(existing) ? null : name,
        icon,
        colorIndex,
        budgetCents: budgetCents && budgetCents > 0 ? budgetCents : null,
      });
    }
    haptics.success();
    router.back();
  };

  const remove = (): void => {
    const count = countExpensesInCategory(id);
    Alert.alert(
      t('common.confirmDeleteTitle'),
      count > 0 ? t('budget.categoryInUse', { count }) : t('common.confirmDeleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteCategory(id);
            haptics.warning();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('budget.addCategory') : name} />
      <Card>
        <FormField label={t('budget.categoryName')}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('budget.categoryName')}
            autoFocus={isNew}
          />
        </FormField>
        <FormField label={t('budget.categoryColor')}>
          <View style={styles.row}>
            {theme.chart.map((c, i) => (
              <PressableScale
                key={c}
                onPress={() => setColorIndex(i)}
                haptic="selection"
                accessibilityRole="radio"
                accessibilityState={{ selected: i === colorIndex }}
                style={[
                  styles.swatch,
                  { backgroundColor: c, borderColor: i === colorIndex ? theme.colors.text : 'transparent' },
                ]}
              >
                {i === colorIndex ? <Icon name="Check" color="#FFFFFF" size={18} strokeWidth={3} /> : null}
              </PressableScale>
            ))}
          </View>
        </FormField>
        <FormField label={t('budget.categoryIcon')}>
          <View style={styles.row}>
            {CATEGORY_ICON_CHOICES.map((ic) => {
              const on = ic === icon;
              const color = theme.chart[colorIndex] ?? theme.colors.brand;
              return (
                <PressableScale
                  key={ic}
                  onPress={() => setIcon(ic)}
                  haptic="selection"
                  accessibilityRole="radio"
                  accessibilityLabel={ic}
                  accessibilityState={{ selected: on }}
                  style={[
                    styles.iconCell,
                    {
                      backgroundColor: on ? `${color}2A` : theme.colors.surface2,
                      borderColor: on ? color : 'transparent',
                    },
                  ]}
                >
                  <Icon name={ic} color={on ? color : theme.colors.textSecondary} size={22} />
                </PressableScale>
              );
            })}
          </View>
        </FormField>
        <FormField label={t('budget.budgetAmount')} hint={t('budget.noBudget')}>
          <CurrencyInput valueCents={budgetCents} onChangeCents={setBudgetCents} placeholder="0,00" />
        </FormField>
        <Button label={t('common.save')} onPress={save} />
        {!isNew && id !== OTHER_CATEGORY_ID ? (
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
