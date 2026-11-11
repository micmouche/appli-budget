/** Scénarios d'achat : liste et comparateur côte à côte (Premium). */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { PremiumGate } from '@/core/PremiumGate';
import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useScenarios } from '@/features/property/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Disclaimer } from '@/ui/Disclaimer';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatPct } from '@/utils/format';

export default function ScenariosScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const scenarios = useScenarios();
  const [selected, setSelected] = useState<string[]>([]);
  const compared = scenarios.filter((s) => selected.includes(s.scenario.id)).slice(0, 3);
  const toneFor = (level: 'ok' | 'warning' | 'exceeded'): string =>
    level === 'exceeded' ? 'negative' : level === 'warning' ? 'warning' : 'positive';

  const rows: {
    label: string;
    render: (s: (typeof compared)[number]) => string;
    tone?: (s: (typeof compared)[number]) => string;
  }[] = [
    { label: t('property.price'), render: (s) => formatCents(s.scenario.priceCents, { compact: true }) },
    {
      label: t('property.downPayment'),
      render: (s) => formatCents(s.scenario.downPaymentCents, { compact: true }),
    },
    {
      label: t('property.notary'),
      render: (s) => formatCents(s.result.notary.totalCents, { compact: true }),
    },
    {
      label: t('property.loanNeeded'),
      render: (s) => formatCents(s.result.principalCents, { compact: true }),
    },
    {
      label: t('property.duration'),
      render: (s) => `${Math.round(s.scenario.months / 12)} ${t('property.durationUnit')}`,
    },
    { label: t('property.rate'), render: (s) => `${s.scenario.rateX100 / 100} %` },
    { label: t('property.totalMonthly'), render: (s) => formatCents(s.result.totalMonthlyCents) },
    {
      label: t('property.totalCost'),
      render: (s) => formatCents(s.result.loan?.totalCostCents ?? 0, { compact: true }),
    },
    {
      label: t('property.debtRatio'),
      render: (s) => formatPct(s.result.debtRatioPct),
      tone: (s) => toneFor(s.result.debtLevel),
    },
    {
      label: t('property.remainingToLive'),
      render: (s) => formatCents(s.result.remainingToLiveCents, { compact: true }),
    },
  ];

  return (
    <PremiumGate module="property">
      <Screen>
        <SubScreenHeader
          title={t('property.scenarios')}
          right={
            <IconButton
              name="Plus"
              accessibilityLabel={t('property.newScenario')}
              filled
              onPress={() =>
                router.push({ pathname: '/(tabs)/immo/simulateur/scenario/[id]', params: { id: 'new' } })
              }
            />
          }
        />
        {scenarios.length === 0 ? (
          <Card>
            <EmptyState
              icon="GitCompareArrows"
              title={t('property.noScenarios')}
              body={t('property.noScenariosHint')}
              compact
              actionLabel={t('property.newScenario')}
              onAction={() =>
                router.push({ pathname: '/(tabs)/immo/simulateur/scenario/[id]', params: { id: 'new' } })
              }
            />
          </Card>
        ) : (
          <>
            <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
              {scenarios.map((s, i) => (
                <ListRow
                  key={s.scenario.id}
                  icon="KeyRound"
                  iconColor={theme.module.property}
                  title={s.scenario.name}
                  subtitle={`${formatCents(s.scenario.priceCents, { compact: true })} · ${formatCents(s.result.totalMonthlyCents)} / mois · ${formatPct(s.result.debtRatioPct)}`}
                  chevron
                  last={i === scenarios.length - 1}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/immo/simulateur/scenario/[id]',
                      params: { id: s.scenario.id },
                    })
                  }
                />
              ))}
            </Card>
            <Text variant="title2" style={{ marginTop: theme.spacing[5], marginBottom: theme.spacing[2] }}>
              {t('property.compareTitle')}
            </Text>
            <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing[2] }}>
              {t('property.selectTwo')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing[3] }}>
              {scenarios.map((s) => (
                <Chip
                  key={s.scenario.id}
                  label={s.scenario.name}
                  selected={selected.includes(s.scenario.id)}
                  onPress={() =>
                    setSelected((cur) =>
                      cur.includes(s.scenario.id)
                        ? cur.filter((x) => x !== s.scenario.id)
                        : [...cur, s.scenario.id].slice(-3),
                    )
                  }
                />
              ))}
            </View>
            {compared.length >= 2 ? (
              <Card padded={false}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ padding: theme.spacing[3] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        paddingBottom: 6,
                      }}
                    >
                      <View style={{ width: 120 }} />
                      {compared.map((s) => (
                        <Text
                          key={s.scenario.id}
                          variant="callout"
                          numberOfLines={1}
                          style={{ width: 110, textAlign: 'right' }}
                        >
                          {s.scenario.name}
                        </Text>
                      ))}
                    </View>
                    {rows.map((r) => (
                      <View key={r.label} style={{ flexDirection: 'row', paddingVertical: 7 }}>
                        <Text variant="caption" color="textSecondary" style={{ width: 120 }}>
                          {r.label}
                        </Text>
                        {compared.map((s) => (
                          <Text
                            key={s.scenario.id}
                            variant="caption"
                            tabular
                            color={r.tone ? r.tone(s) : 'text'}
                            style={{ width: 110, textAlign: 'right' }}
                          >
                            {r.render(s)}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </Card>
            ) : null}
          </>
        )}
        <View style={{ marginTop: theme.spacing[4] }}>
          <Disclaimer />
        </View>
      </Screen>
    </PremiumGate>
  );
}
