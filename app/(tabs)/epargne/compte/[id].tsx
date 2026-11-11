/** Détail d'un compte : solde, plafond, mouvements. */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { listMovementsForAccount } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { useSavings } from '@/features/savings/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatPct, formatRelativeDay } from '@/utils/format';

export default function SavingsAccountScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accounts } = useSavings();
  const summary = accounts.find((a) => a.account.id === id);
  const movements = useQuery(() => listMovementsForAccount(id), [id]);
  if (!summary) {
    return (
      <Screen>
        <SubScreenHeader title={t('savings.title')} />
      </Screen>
    );
  }
  const typeLabel = {
    deposit: t('savings.deposit'),
    withdrawal: t('savings.withdrawal'),
    interest: t('savings.interest'),
  };
  const typeIcon = { deposit: 'ArrowDownToLine', withdrawal: 'ArrowUpFromLine', interest: 'Sparkles' };
  return (
    <Screen>
      <SubScreenHeader
        title={summary.account.name}
        right={
          <IconButton
            name="Pencil"
            accessibilityLabel={t('savings.editAccount')}
            onPress={() => router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id } })}
          />
        }
      />
      <Card>
        <Text variant="caption" color="textSecondary">
          {t(`savings.types.${summary.account.type}`)}
          {summary.account.rateX100 !== null ? ` · ${formatPct(summary.account.rateX100 / 100, 2)}` : ''}
        </Text>
        <Amount cents={summary.balanceCents} variant="display" style={{ marginTop: 4 }} />
        {summary.ceiling ? (
          <View style={{ marginTop: theme.spacing[3] }}>
            <ProgressBar
              value={summary.ceiling.usedPct / 100}
              level={
                summary.ceiling.level === 'reached'
                  ? 'exceeded'
                  : summary.ceiling.level === 'near'
                    ? 'warning'
                    : 'ok'
              }
            />
            <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
              {t('savings.ceiling')} {formatCents(summary.ceiling.ceilingCents, { compact: true })} ·{' '}
              {summary.ceiling.level === 'reached'
                ? t('savings.ceilingReached')
                : t('savings.ceilingNear', {
                    remaining: formatCents(summary.ceiling.remainingCents, { compact: true }),
                  })}
            </Text>
          </View>
        ) : null}
        <Button
          label={t('savings.addMovement')}
          icon="Plus"
          style={{ marginTop: theme.spacing[4] }}
          onPress={() =>
            router.push({ pathname: '/(tabs)/epargne/mouvement/[id]', params: { id: 'new', accountId: id } })
          }
        />
      </Card>
      <Text variant="title2" style={{ marginTop: theme.spacing[5], marginBottom: theme.spacing[2] }}>
        {t('savings.movements')}
      </Text>
      {movements.length === 0 ? (
        <Card>
          <EmptyState icon="ArrowDownToLine" title={t('savings.noMovements')} compact />
        </Card>
      ) : (
        <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
          {movements.map((m, i) => (
            <ListRow
              key={m.id}
              icon={typeIcon[m.type]}
              iconColor={
                m.type === 'withdrawal'
                  ? theme.colors.negative
                  : m.type === 'interest'
                    ? theme.colors.warningFill
                    : theme.colors.positiveFill
              }
              title={m.note || typeLabel[m.type]}
              subtitle={`${formatRelativeDay(m.date)}${m.note ? ` · ${typeLabel[m.type]}` : ''}`}
              right={
                <Amount
                  cents={m.type === 'withdrawal' ? -m.amountCents : m.amountCents}
                  variant="headline"
                  colored
                  signed
                />
              }
              last={i === movements.length - 1}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/epargne/mouvement/[id]',
                  params: { id: m.id, accountId: id },
                })
              }
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
