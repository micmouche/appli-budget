/** Liste unifiée des opérations : recherche, filtres (type, compte, membre, période), groupées par jour. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { subMonths } from 'date-fns';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { categoryLabel, listAllTransactions } from '@/db/repositories';
import type { TransactionKind } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { ACCOUNT_ICONS } from '@/features/budget/AccountsStrip';
import { useAccounts, useCategories, usePersons } from '@/features/budget/hooks';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Input } from '@/ui/Form';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatRelativeDay, toIsoDate } from '@/utils/format';

type Period = 'month' | 'quarter' | 'all';

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function OperationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const all = useQuery(() => listAllTransactions(), []);
  const categories = useCategories();
  const persons = usePersons();
  const couple = useSettings((s) => s.couple);
  const { accounts } = useAccounts();

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<TransactionKind | 'all'>('all');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [today] = useState(() => new Date());

  const rows = useMemo(() => {
    const since =
      period === 'month'
        ? toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1))
        : period === 'quarter'
          ? toIsoDate(subMonths(today, 3))
          : '';
    const q = normalize(query.trim());
    const catName = new Map(categories.map((c) => [c.id, normalize(categoryLabel(c))]));
    const accName = new Map(accounts.map((a) => [a.account.id, normalize(a.account.name)]));
    return all
      .filter((e) => e.date >= since)
      .filter((e) => kind === 'all' || e.kind === kind)
      .filter((e) => !accountId || e.accountId === accountId || e.toAccountId === accountId)
      .filter((e) => !personId || e.paidById === personId)
      .filter((e) => {
        if (!q) return true;
        const hay = [
          e.note ?? '',
          catName.get(e.categoryId) ?? '',
          accName.get(e.accountId ?? '') ?? '',
          e.incomeSource ? normalize(t(`budget.income.sources.${e.incomeSource}`)) : '',
          String(e.amountCents / 100).replace('.', ','),
        ].join(' ');
        return normalize(hay).includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1));
  }, [all, period, today, query, categories, accounts, kind, accountId, personId, t]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return [...map.entries()];
  }, [rows]);

  const net = rows.reduce(
    (a, e) => (e.kind === 'income' ? a + e.amountCents : e.kind === 'expense' ? a - e.amountCents : a),
    0,
  );

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('budget.operations.title')} />
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t('budget.operations.searchPlaceholder')}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: theme.spacing[2] }}
        contentContainerStyle={{ gap: 8 }}
      >
        {(['month', 'quarter', 'all'] as const).map((p) => (
          <Chip
            key={p}
            label={t(
              p === 'month'
                ? 'budget.operations.thisMonth'
                : p === 'quarter'
                  ? 'budget.operations.threeMonths'
                  : 'budget.operations.allTime',
            )}
            selected={period === p}
            onPress={() => setPeriod(p)}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: theme.spacing[2] }}
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip
          label={t('budget.operations.allKinds')}
          selected={kind === 'all'}
          onPress={() => setKind('all')}
        />
        {(['expense', 'income', 'transfer'] as const).map((k) => (
          <Chip
            key={k}
            label={t(`budget.kinds.${k}`)}
            icon={
              k === 'income' ? 'ArrowDownToLine' : k === 'transfer' ? 'ArrowLeftRight' : 'ArrowUpFromLine'
            }
            selected={kind === k}
            onPress={() => setKind(k)}
          />
        ))}
      </ScrollView>
      {accounts.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: theme.spacing[2] }}
          contentContainerStyle={{ gap: 8 }}
        >
          <Chip
            label={t('budget.operations.allAccounts')}
            selected={accountId === null}
            onPress={() => setAccountId(null)}
          />
          {accounts.map((a) => (
            <Chip
              key={a.account.id}
              label={a.account.name}
              icon={ACCOUNT_ICONS[a.account.type]}
              selected={accountId === a.account.id}
              onPress={() => setAccountId(a.account.id)}
            />
          ))}
        </ScrollView>
      ) : null}
      {couple ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: theme.spacing[2] }}
          contentContainerStyle={{ gap: 8 }}
        >
          <Chip
            label={t('budget.operations.everyone')}
            icon="Users"
            selected={personId === null}
            onPress={() => setPersonId(null)}
          />
          {persons.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              icon="User"
              selected={personId === p.id}
              onPress={() => setPersonId(p.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing[3],
          marginBottom: theme.spacing[2],
        }}
      >
        <Text variant="caption" color="textSecondary">
          {t('budget.operations.count', { count: rows.length })}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="caption" color="textSecondary">
            {t('budget.operations.net')}
          </Text>
          <Amount cents={net} variant="callout" colored signed />
        </View>
      </View>

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon="Search" title={t('budget.operations.noResults')} compact />
        </Card>
      ) : (
        groups.map(([date, ops]) => (
          <View key={date} style={{ marginBottom: theme.spacing[3] }}>
            <Text variant="caption" color="textMuted" style={{ marginBottom: 6 }}>
              {formatRelativeDay(date)}
            </Text>
            <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
              {ops.map((op, i) => {
                const cat = categories.find((c) => c.id === op.categoryId);
                const payer = couple ? persons.find((p) => p.id === op.paidById)?.name : undefined;
                const acc = accounts.find((a) => a.account.id === op.accountId)?.account.name;
                const to =
                  op.kind === 'transfer'
                    ? (accounts.find((a) => a.account.id === op.toAccountId)?.account.name ??
                      t('budget.transfer.toSavings'))
                    : undefined;
                const title =
                  op.kind === 'income'
                    ? t(`budget.income.sources.${op.incomeSource ?? 'other'}`)
                    : op.kind === 'transfer'
                      ? `${acc ?? '?'} → ${to}`
                      : cat
                        ? categoryLabel(cat)
                        : '?';
                const icon =
                  op.kind === 'income'
                    ? 'ArrowDownToLine'
                    : op.kind === 'transfer'
                      ? 'ArrowLeftRight'
                      : (cat?.icon ?? 'CircleEllipsis');
                const iconColor =
                  op.kind === 'income'
                    ? theme.colors.positive
                    : op.kind === 'transfer'
                      ? theme.colors.info
                      : cat
                        ? theme.chart[cat.colorIndex % theme.chart.length]
                        : theme.colors.textMuted;
                const signed =
                  op.kind === 'income'
                    ? op.amountCents
                    : op.kind === 'expense'
                      ? -op.amountCents
                      : op.amountCents;
                return (
                  <ListRow
                    key={op.id}
                    icon={icon}
                    iconColor={iconColor}
                    title={title}
                    subtitle={[op.note, op.kind !== 'transfer' && accounts.length > 1 ? acc : null, payer]
                      .filter(Boolean)
                      .join(' · ')}
                    right={
                      <Amount
                        cents={signed}
                        variant="headline"
                        colored={op.kind === 'income'}
                        signed={op.kind === 'income'}
                        color={op.kind === 'transfer' ? 'textSecondary' : undefined}
                      />
                    }
                    last={i === ops.length - 1}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: op.id } })
                    }
                  />
                );
              })}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
