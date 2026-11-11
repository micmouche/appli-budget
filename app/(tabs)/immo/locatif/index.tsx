/** Locatif : loyers du mois, logements, accès déclaration et bailleur. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PremiumGate } from '@/core/PremiumGate';
import { SubScreenHeader } from '@/core/SubScreenHeader';
import { StatusBadge } from '@/features/rental/StatusBadge';
import { useRentals } from '@/features/rental/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatPct } from '@/utils/format';

export default function RentalHome(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { views, monthViews, monthDueCents, monthPaidCents } = useRentals();
  const paidCount = monthViews.filter((p) => p.status === 'paid').length;
  return (
    <PremiumGate module="rental">
      <Screen>
        <SubScreenHeader
          title={t('rental.title')}
          right={
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                name="FileText"
                accessibilityLabel={t('rental.declaration')}
                onPress={() => router.push('/(tabs)/immo/locatif/declaration')}
              />
              <IconButton
                name="Plus"
                accessibilityLabel={t('rental.addProperty')}
                filled
                onPress={() =>
                  router.push({ pathname: '/(tabs)/immo/locatif/logement/editer', params: { id: 'new' } })
                }
              />
            </View>
          }
        />
        {monthViews.length > 0 ? (
          <Card style={{ marginBottom: theme.spacing[3] }}>
            <Text variant="caption" color="textSecondary">
              {t('rental.monthRents')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Amount cents={monthPaidCents} variant="title1" />
              <Text variant="callout" color="textSecondary" style={{ paddingBottom: 4 }}>
                / {formatCents(monthDueCents, { compact: true })}
              </Text>
            </View>
            <View style={{ marginTop: theme.spacing[2] }}>
              <ProgressBar
                value={monthDueCents ? monthPaidCents / monthDueCents : 0}
                color={theme.colors.positiveFill}
              />
            </View>
            <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
              {paidCount} / {monthViews.length} {t('rental.collected')}
            </Text>
          </Card>
        ) : null}
        {views.length === 0 ? (
          <Card>
            <EmptyState
              icon="Building"
              title={t('rental.noProperties')}
              body={t('rental.noPropertiesHint')}
              compact
              actionLabel={t('rental.addProperty')}
              onAction={() =>
                router.push({ pathname: '/(tabs)/immo/locatif/logement/editer', params: { id: 'new' } })
              }
            />
          </Card>
        ) : (
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
            {views.map((v, i) => {
              const color = theme.chart[v.property.colorIndex % theme.chart.length] ?? theme.module.rental;
              return (
                <ListRow
                  key={v.property.id}
                  icon={
                    v.property.type === 'house'
                      ? 'House'
                      : v.property.type === 'parking'
                        ? 'CarFront'
                        : 'Building'
                  }
                  iconColor={color}
                  title={v.property.name}
                  subtitle={
                    v.lease
                      ? `${v.lease.tenantName} · ${formatCents(v.lease.rentCents + v.lease.chargesCents)} / mois${v.yieldResult ? ` · ${formatPct(v.yieldResult.netYieldPct, 1)} net` : ''}`
                      : t('rental.noLease')
                  }
                  right={v.currentMonth ? <StatusBadge status={v.currentMonth.status} /> : undefined}
                  chevron
                  last={i === views.length - 1}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/immo/locatif/logement/[id]',
                      params: { id: v.property.id },
                    })
                  }
                />
              );
            })}
          </Card>
        )}
        <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], marginTop: theme.spacing[3] }}>
          <ListRow
            icon="UserRound"
            title={t('rental.landlord')}
            subtitle={t('rental.landlordHint')}
            chevron
            last
            onPress={() => router.push('/(tabs)/immo/locatif/bailleur')}
          />
        </Card>
      </Screen>
    </PremiumGate>
  );
}
