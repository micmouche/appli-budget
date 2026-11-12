/** Détail d'un compte : solde et opérations. */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { categoryLabel, listTransactionsForAccount } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { ACCOUNT_ICONS } from '@/features/budget/AccountsStrip';
import { useAccounts, useCategories, usePersons } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatRelativeDay } from '@/utils/format';

export default function AccountScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accounts } = useAccounts();
  const view = accounts.find((a) => a.account.id === id);
  const ops = useQuery(() => listTransactionsForAccount(id), [id]);
  const categories = useCategories();
  const persons = usePersons();
  if (!view) {
    return (
      <Screen>
        <SubScreenHeader title={t('budget.accounts.account')} />
      </Screen>
    );
  }
  const color = theme.chart[view.account.colorIndex % theme.chart.length] ?? theme.colors.brand;
  return (
    <Screen>
      <SubScreenHeader title={view.account.name} right={<IconButton name="Pencil" accessibilityLabel={t('budget.accounts.editAccount')} onPress={() => router.push({ pathname: '/(tabs)/budget/compte/editer', params: { id } })} />} />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="caption" color="textSecondary">
          {t(`budget.accounts.types.${view.account.type}`)}
          {view.account.ownerId ? ` · ${persons.find((p) => p.id === view.account.ownerId)?.name ?? ''}` : ` · ${t('budget.accounts.ownerShared')}`}
        </Text>
        <Amount cents={view.balanceCents} variant="display" colored={view.balanceCents < 0} />
      </Card>
      <Text variant="title2" style={{ marginBottom: theme.spacing[2] }}>
        {t('budget.accounts.operations')}
      </Text>
      {ops.length === 0 ? (
        <Card>
          <EmptyState icon={ACCOUNT_ICONS[view.account.type] ?? 'Wallet'} title={t('budget.accounts.noOperations')} compact />
        </Card>
      ) : (
        <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
          {ops.map((op, i) => {
            const cat = categories.find((c) => c.id === op.categoryId);
            const incoming = op.kind === 'income' || (op.kind === 'transfer' && op.toAccountId === id);
            const signed = incoming ? op.amountCents : -op.amountCents;
            const other = op.kind === 'transfer' ? accounts.find((a) => a.account.id === (op.accountId === id ? op.toAccountId : op.accountId))?.account.name : undefined;
            const title = op.kind === 'income' ? t(`budget.income.sources.${op.incomeSource ?? 'other'}`) : op.kind === 'transfer' ? `${t('budget.kinds.transfer')}${other ? ` · ${other}` : ''}` : cat ? categoryLabel(cat) : '?';
            const icon = op.kind === 'income' ? 'ArrowDownToLine' : op.kind === 'transfer' ? 'ArrowLeftRight' : (cat?.icon ?? 'CircleEllipsis');
            const iconColor = op.kind === 'income' ? theme.colors.positive : op.kind === 'transfer' ? theme.colors.info : cat ? theme.chart[cat.colorIndex % theme.chart.length] : color;
            return (
              <ListRow
                key={op.id}
                icon={icon}
                iconColor={iconColor}
                title={title}
                subtitle={[formatRelativeDay(op.date), op.note].filter(Boolean).join(' · ')}
                right={<Amount cents={signed} variant="headline" colored={incoming} signed={incoming} />}
                last={i === ops.length - 1}
                onPress={() => router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: op.id } })}
              />
            );
          })}
        </Card>
      )}
      <View style={{ height: theme.spacing[4] }} />
    </Screen>
  );
}
