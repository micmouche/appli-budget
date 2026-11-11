/**
 * Saisie rapide d'une dépense en 2 tapes : montant au pavé numérique, puis tap sur
 * une catégorie = enregistrement. Options secondaires repliées (date, payeur, commune, note).
 */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subDays } from 'date-fns';

import { categoryLabel, createExpense, deleteExpense } from '@/db/repositories';
import { useCategories, usePersons } from '@/features/budget/hooks';
import { parseEurosInput } from '@/finance/money';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Form';
import { NumPad } from '@/ui/NumPad';
import { PressableScale } from '@/ui/Pressable';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatCents, formatRelativeDay, toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function QuickAddScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const persons = usePersons();
  const couple = useSettings((s) => s.couple);

  const [amountText, setAmountText] = useState('');
  const [more, setMore] = useState(false);
  const [date, setDate] = useState(new Date());
  const [paidById, setPaidById] = useState<string | null>(persons[0]?.id ?? null);
  const [shared, setShared] = useState(true);
  const [note, setNote] = useState('');

  const amountCents = useMemo(() => parseEurosInput(amountText), [amountText]);
  const canSave = amountCents !== null && amountCents > 0;

  const save = (categoryId: string): void => {
    if (!canSave || amountCents === null) {
      haptics.error();
      return;
    }
    const category = categories.find((c) => c.id === categoryId);
    const created = createExpense({ amountCents, categoryId, date: toIsoDate(date), paidById, shared, note });
    haptics.success();
    showToast(
      t('budget.expenseAdded', {
        category: category ? categoryLabel(category) : '',
        amount: formatCents(amountCents),
      }),
      {
        actionLabel: t('common.undo'),
        onAction: () => deleteExpense(created.id),
      },
    );
    router.back();
  };

  const dateOptions = [new Date(), subDays(new Date(), 1), subDays(new Date(), 2)];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top + 8 }}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing[3] }]}>
        <IconButton name="X" accessibilityLabel={t('common.close')} onPress={() => router.back()} />
        <Text variant="headline">{t('budget.newExpense')}</Text>
        <IconButton
          name={more ? 'ChevronUp' : 'SlidersHorizontal'}
          accessibilityLabel={t('common.more')}
          onPress={() => setMore((m) => !m)}
        />
      </View>

      <View style={{ alignItems: 'center', paddingVertical: theme.spacing[3] }}>
        <Text
          variant="display"
          tabular
          color={canSave ? 'text' : 'textMuted'}
          accessibilityLabel={`${t('budget.amount')} ${amountText || '0'}`}
        >
          {amountText === '' ? '0' : amountText} €
        </Text>
        <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
          {formatRelativeDay(date)}
          {couple && paidById ? ` · ${persons.find((p) => p.id === paidById)?.name ?? ''}` : ''}
          {' · '}
          {shared ? t('budget.shared') : t('budget.personal')}
        </Text>
      </View>

      {more ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={Layout.duration(200)}
          style={{ paddingHorizontal: theme.spacing[5], gap: theme.spacing[2] }}
        >
          <View style={styles.chipRow}>
            {dateOptions.map((d) => (
              <Chip
                key={toIsoDate(d)}
                label={formatRelativeDay(d)}
                selected={toIsoDate(d) === toIsoDate(date)}
                onPress={() => setDate(d)}
              />
            ))}
          </View>
          {couple ? (
            <View style={styles.chipRow}>
              {persons.map((p) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  icon="User"
                  selected={paidById === p.id}
                  onPress={() => setPaidById(p.id)}
                />
              ))}
              <Chip
                label={shared ? t('budget.shared') : t('budget.personal')}
                icon={shared ? 'Users' : 'User'}
                selected={shared}
                onPress={() => setShared((s) => !s)}
              />
            </View>
          ) : null}
          <Input
            value={note}
            onChangeText={setNote}
            placeholder={t('budget.notePlaceholder')}
            returnKeyType="done"
          />
        </Animated.View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: theme.spacing[5], paddingVertical: theme.spacing[2] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.grid}>
          {categories.map((c) => {
            const color = theme.chart[c.colorIndex % theme.chart.length] ?? theme.colors.brand;
            return (
              <PressableScale
                key={c.id}
                onPress={() => save(c.id)}
                scaleTo={0.92}
                accessibilityRole="button"
                accessibilityLabel={categoryLabel(c)}
                accessibilityState={{ disabled: !canSave }}
                style={[styles.cell, { opacity: canSave ? 1 : 0.5 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
                  <Icon name={c.icon} color={color} size={26} />
                </View>
                <Text variant="caption" align="center" numberOfLines={1}>
                  {categoryLabel(c)}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: theme.spacing[5],
          paddingBottom: insets.bottom + theme.spacing[3],
          paddingTop: theme.spacing[2],
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        }}
      >
        <NumPad value={amountText} onChange={setAmountText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  cell: { width: '25%', alignItems: 'center', gap: 6 },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
