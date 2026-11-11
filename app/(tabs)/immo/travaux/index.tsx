/** Travaux : liste des chantiers avec engagé / payé / budget. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PremiumGate } from '@/core/PremiumGate';
import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useWorks } from '@/features/works/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents } from '@/utils/format';

export default function WorksHome(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const projects = useWorks();
  const newProject = () =>
    router.push({ pathname: '/(tabs)/immo/travaux/chantier/editer', params: { id: 'new' } });
  return (
    <PremiumGate module="works">
      <Screen>
        <SubScreenHeader
          title={t('works.title')}
          right={
            <IconButton name="Plus" accessibilityLabel={t('works.addProject')} filled onPress={newProject} />
          }
        />
        {projects.length === 0 ? (
          <Card>
            <EmptyState
              icon="Hammer"
              title={t('works.noProjects')}
              body={t('works.noProjectsHint')}
              compact
              actionLabel={t('works.addProject')}
              onAction={newProject}
            />
          </Card>
        ) : (
          <View style={{ gap: theme.spacing[3] }}>
            {projects.map((v) => {
              const color = theme.chart[v.project.colorIndex % theme.chart.length] ?? theme.module.works;
              const t2 = v.totals;
              return (
                <Card
                  key={v.project.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/immo/travaux/chantier/[id]',
                      params: { id: v.project.id },
                    })
                  }
                  accessibilityLabel={v.project.name}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${color}1F`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="Hammer" color={color} size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="headline">{v.project.name}</Text>
                      <Text variant="caption" color="textSecondary">
                        {t('works.committed')} {formatCents(t2.committedCents, { compact: true })} ·{' '}
                        {t('works.budget')} {formatCents(t2.budgetCents, { compact: true })}
                      </Text>
                    </View>
                    <Text
                      variant="headline"
                      tabular
                      color={
                        t2.level === 'exceeded' ? 'negative' : t2.level === 'warning' ? 'warning' : 'text'
                      }
                    >
                      {Math.round(t2.paidPct)} %
                    </Text>
                  </View>
                  <View style={{ marginTop: theme.spacing[3] }}>
                    <ProgressBar value={t2.paidPct / 100} color={color} />
                  </View>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                    {t('works.paid')} {formatCents(t2.paidCents, { compact: true })} ·{' '}
                    {t('works.remainingToPay')} {formatCents(t2.remainingToPayCents, { compact: true })}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}
      </Screen>
    </PremiumGate>
  );
}
