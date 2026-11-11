/** Dépenses récurrentes : liste et ajout. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { categoryLabel, listRecurring, updateRecurring } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { useCategories } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { formatDate } from '@/utils/format';

export default function RecurringScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const items = useQuery(() => listRecurring(), []);
  const categories = useCategories();
  const freqLabel = {
    weekly: t('budget.recurrenceWeekly'),
    monthly: t('budget.recurrenceMonthly'),
    yearly: t('budget.recurrenceYearly'),
  };
  return (
    <Screen>
      <SubScreenHeader
        title={t('budget.recurring')}
        right={
          <IconButton
            name="Plus"
            accessibilityLabel={t('common.add')}
            filled
            onPress={() => router.push({ pathname: '/(tabs)/budget/recurrence/[id]', params: { id: 'new' } })}
          />
        }
      />
      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon="Repeat"
            title={t('budget.recurringEmpty')}
            body={t('budget.recurringHint')}
            compact
            actionLabel={t('common.add')}
            onAction={() =>
              router.push({ pathname: '/(tabs)/budget/recurrence/[id]', params: { id: 'new' } })
            }
          />
        </Card>
      ) : (
        <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
          {items.map((r, i) => {
            const c = categories.find((x) => x.id === r.categoryId);
            const color = c ? theme.chart[c.colorIndex % theme.chart.length] : undefined;
            return (
              <ListRow
                key={r.id}
                icon={c?.icon ?? 'Repeat'}
                iconColor={color}
                title={r.note || (c ? categoryLabel(c) : '?')}
                subtitle={`${freqLabel[r.frequency]} · ${t('budget.nextOccurrence', { date: formatDate(r.nextDate) })}`}
                last={i === items.length - 1}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/budget/recurrence/[id]', params: { id: r.id } })
                }
                right={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Amount cents={r.amountCents} variant="callout" />
                    <Switch
                      value={r.active}
                      onValueChange={(v) => updateRecurring(r.id, { active: v })}
                      trackColor={{ true: theme.colors.brand }}
                      style={{ transform: [{ scale: 0.8 }] }}
                      accessibilityLabel={r.note ?? ''}
                    />
                  </View>
                }
              />
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
