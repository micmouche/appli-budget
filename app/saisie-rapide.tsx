/**
 * Saisie rapide : dépense (montant puis tap sur une catégorie), revenu (nature du revenu)
 * ou transfert entre comptes / vers l'épargne. Options secondaires repliées.
 */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subDays } from 'date-fns';

import {
  categoryLabel,
  createExpense,
  createSavingsMovement,
  deleteExpense,
  listSavingsAccounts,
} from '@/db/repositories';
import { INCOME_SOURCES, type TransactionKind } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { SAVINGS_PREFIX } from '@/features/budget/accounts';
import { ACCOUNT_ICONS } from '@/features/budget/AccountsStrip';
import { useAccounts, useCategories, usePersons } from '@/features/budget/hooks';
import { OTHER_CATEGORY_ID } from '@/db/defaultCategories';
import { parseEurosInput } from '@/finance/money';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Input } from '@/ui/Form';
import { NumPad } from '@/ui/NumPad';
import { PressableScale } from '@/ui/Pressable';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatCents, formatRelativeDay, toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

const INCOME_ICONS: Record<string, string> = {
  salary: 'Briefcase',
  bonus: 'Sparkles',
  benefits: 'HandCoins',
  refund: 'RotateCcw',
  rent: 'KeyRound',
  gift: 'Gift',
  sale: 'Tag',
  other: 'CircleEllipsis',
};

export default function QuickAddScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const persons = usePersons();
  const couple = useSettings((s) => s.couple);
  const { accounts, defaultAccount } = useAccounts();
  const savingsAccounts = useQuery(() => listSavingsAccounts(), []);

  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amountText, setAmountText] = useState('');
  const [more, setMore] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [paidById, setPaidById] = useState<string | null>(persons[0]?.id ?? null);
  const [shared, setShared] = useState(true);
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<string | null>(defaultAccount?.id ?? null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);

  const amountCents = useMemo(() => parseEurosInput(amountText), [amountText]);
  const canSave = amountCents !== null && amountCents > 0;
  const fallbackCategoryId =
    categories.find((c) => c.id === OTHER_CATEGORY_ID)?.id ?? categories[0]?.id ?? OTHER_CATEGORY_ID;

  const finish = (message: string, createdId: string): void => {
    haptics.success();
    showToast(message, { actionLabel: t('common.undo'), onAction: () => deleteExpense(createdId) });
    router.back();
  };

  const saveExpense = (categoryId: string): void => {
    if (!canSave || amountCents === null) {
      haptics.error();
      return;
    }
    const category = categories.find((c) => c.id === categoryId);
    const created = createExpense({
      amountCents,
      categoryId,
      date: toIsoDate(date),
      paidById,
      shared,
      note,
      accountId,
    });
    finish(
      t('budget.expenseAdded', {
        category: category ? categoryLabel(category) : '',
        amount: formatCents(amountCents),
      }),
      created.id,
    );
  };

  const saveIncome = (source: string): void => {
    if (!canSave || amountCents === null) {
      haptics.error();
      return;
    }
    const created = createExpense({
      amountCents,
      categoryId: fallbackCategoryId,
      date: toIsoDate(date),
      paidById,
      shared: false,
      note,
      kind: 'income',
      incomeSource: source,
      accountId,
    });
    finish(
      t('budget.income.added', {
        source: t(`budget.income.sources.${source}`),
        amount: formatCents(amountCents),
      }),
      created.id,
    );
  };

  const saveTransfer = (): void => {
    if (!canSave || amountCents === null || !accountId || !toAccountId || accountId === toAccountId) {
      haptics.error();
      return;
    }
    const created = createExpense({
      amountCents,
      categoryId: fallbackCategoryId,
      date: toIsoDate(date),
      paidById,
      shared: false,
      note,
      kind: 'transfer',
      accountId,
      toAccountId,
    });
    if (toAccountId.startsWith(SAVINGS_PREFIX)) {
      createSavingsMovement({
        accountId: toAccountId.slice(SAVINGS_PREFIX.length),
        type: 'deposit',
        amountCents,
        date: toIsoDate(date),
        note: note || t('budget.kinds.transfer'),
      });
    }
    finish(t('budget.transfer.added', { amount: formatCents(amountCents) }), created.id);
  };

  const dateOptions = [date, subDays(new Date(), 1), subDays(new Date(), 2)].filter(
    (d, i, arr) => arr.findIndex((x) => toIsoDate(x) === toIsoDate(d)) === i,
  );
  const title =
    kind === 'expense'
      ? t('budget.newExpense')
      : kind === 'income'
        ? t('budget.kinds.income')
        : t('budget.kinds.transfer');
  const accountChips = (
    selected: string | null,
    onSelect: (id: string) => void,
    exclude?: string | null,
  ): React.JSX.Element => (
    <View style={styles.chipRow}>
      {accounts
        .filter((a) => a.account.id !== exclude)
        .map((a) => (
          <Chip
            key={a.account.id}
            label={a.account.name}
            icon={ACCOUNT_ICONS[a.account.type]}
            selected={selected === a.account.id}
            onPress={() => onSelect(a.account.id)}
          />
        ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top + 8 }}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing[3] }]}>
        <IconButton
          name="X"
          color="brand"
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
          filled
        />
        <Text variant="title2">{title}</Text>
        <IconButton
          name={more ? 'ChevronUp' : 'SlidersHorizontal'}
          color="brand"
          accessibilityLabel={t('common.more')}
          onPress={() => setMore((m) => !m)}
          filled
        />
      </View>

      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[2] }}>
        <Segmented<TransactionKind>
          options={[
            { value: 'expense', label: t('budget.kinds.expense') },
            { value: 'income', label: t('budget.kinds.income') },
            { value: 'transfer', label: t('budget.kinds.transfer') },
          ]}
          value={kind}
          onChange={setKind}
        />
      </View>

      <View style={{ alignItems: 'center', paddingTop: theme.spacing[2], paddingBottom: theme.spacing[1] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text
            variant="hero"
            tabular
            color={canSave ? (kind === 'income' ? 'positive' : 'text') : 'textMuted'}
            accessibilityLabel={`${t('budget.amount')} ${amountText || '0'}`}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ flexShrink: 1 }}
          >
            {kind === 'income' && canSave ? '+' : ''}
            {amountText === '' ? '0' : amountText}
          </Text>
          <Text variant="title2" tabular color="textSecondary" style={{ marginBottom: 10, marginLeft: 4 }}>
            €
          </Text>
        </View>
        <Text variant="callout" color="textSecondary" style={{ marginTop: 2 }}>
          {formatRelativeDay(date)}
          {accounts.find((a) => a.account.id === accountId)
            ? ` · ${accounts.find((a) => a.account.id === accountId)?.account.name}`
            : ''}
          {kind === 'expense' && couple && paidById
            ? ` · ${persons.find((p) => p.id === paidById)?.name ?? ''}`
            : ''}
          {kind === 'expense' ? ` · ${shared ? t('budget.shared') : t('budget.personal')}` : ''}
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
          {kind !== 'transfer' && accounts.length > 1 ? accountChips(accountId, setAccountId) : null}
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
              {kind === 'expense' ? (
                <Chip
                  label={shared ? t('budget.shared') : t('budget.personal')}
                  icon={shared ? 'Users' : 'User'}
                  selected={shared}
                  onPress={() => setShared((s) => !s)}
                />
              ) : null}
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
        {kind === 'expense' ? (
          <View style={styles.grid}>
            {categories.map((c) => {
              const color = theme.chart[c.colorIndex % theme.chart.length] ?? theme.colors.brand;
              return (
                <PressableScale
                  key={c.id}
                  onPress={() => saveExpense(c.id)}
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
        ) : null}
        {kind === 'income' ? (
          <View style={styles.grid}>
            {INCOME_SOURCES.map((s) => (
              <PressableScale
                key={s}
                onPress={() => saveIncome(s)}
                scaleTo={0.92}
                accessibilityRole="button"
                accessibilityLabel={t(`budget.income.sources.${s}`)}
                accessibilityState={{ disabled: !canSave }}
                style={[styles.cell, { opacity: canSave ? 1 : 0.5 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.positive}1F` }]}>
                  <Icon name={INCOME_ICONS[s] ?? 'CircleEllipsis'} color={theme.colors.positive} size={26} />
                </View>
                <Text variant="caption" align="center" numberOfLines={1}>
                  {t(`budget.income.sources.${s}`)}
                </Text>
              </PressableScale>
            ))}
          </View>
        ) : null}
        {kind === 'transfer' ? (
          <View style={{ gap: theme.spacing[2] }}>
            <Text variant="caption" color="textSecondary">
              {t('budget.transfer.from')}
            </Text>
            {accountChips(accountId, setAccountId, toAccountId)}
            <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing[1] }}>
              {t('budget.transfer.to')}
            </Text>
            {accountChips(toAccountId, setToAccountId, accountId)}
            {savingsAccounts.length > 0 ? (
              <>
                <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing[1] }}>
                  {t('budget.transfer.toSavings')}
                </Text>
                <View style={styles.chipRow}>
                  {savingsAccounts.map((s) => (
                    <Chip
                      key={s.id}
                      label={s.name}
                      icon="PiggyBank"
                      selected={toAccountId === `${SAVINGS_PREFIX}${s.id}`}
                      onPress={() => setToAccountId(`${SAVINGS_PREFIX}${s.id}`)}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <Button
              label={t('common.save')}
              onPress={saveTransfer}
              disabled={!canSave || !accountId || !toAccountId || accountId === toAccountId}
              style={{ marginTop: theme.spacing[2] }}
            />
          </View>
        ) : null}
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
