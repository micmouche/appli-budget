/** Déclaration annuelle : loyers encaissés et charges par nature (tous logements), export CSV. */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ResultRow } from '@/features/property/ResultRow';
import { exportDeclarationCsv } from '@/features/rental/export';
import { useRentals } from '@/features/rental/hooks';
import { declarationSummary } from '@/features/rental/logic';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Disclaimer } from '@/ui/Disclaimer';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatCents } from '@/utils/format';

export default function DeclarationScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const { views } = useRentals();
  const current = new Date().getFullYear();
  const [year, setYear] = useState(current);
  const summary = useMemo(
    () =>
      declarationSummary(
        year,
        views.flatMap((v) => v.payments.map((p) => p.payment)),
        views.flatMap((v) => v.charges),
      ),
    [year, views],
  );
  return (
    <Screen>
      <SubScreenHeader title={t('rental.declaration')} />
      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing[3] }}>
        {t('rental.declarationHint')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: theme.spacing[3] }}>
        {[current - 2, current - 1, current].map((y) => (
          <Chip key={y} label={String(y)} selected={year === y} onPress={() => setYear(y)} />
        ))}
      </View>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <ResultRow
          label={t('rental.rentsCollected')}
          value={formatCents(summary.rentsCollectedCents)}
          strong
        />
        {Object.entries(summary.byNature).map(([nature, cents]) => (
          <ResultRow key={nature} label={t(`rental.natures.${nature}`)} value={formatCents(cents)} />
        ))}
        <ResultRow
          label={t('rental.deductibleTotal')}
          value={formatCents(summary.deductibleTotalCents)}
          strong
        />
        <ResultRow
          label={t('rental.netResult')}
          value={formatCents(summary.netResultCents)}
          strong
          tone={summary.netResultCents < 0 ? 'negative' : 'positive'}
          last
        />
      </Card>
      <Button
        label={t('rental.exportDeclaration')}
        icon="FileSpreadsheet"
        variant="secondary"
        onPress={() =>
          void exportDeclarationCsv(
            summary,
            views.map((v) => v.property.name),
          ).catch(() => showToast(t('common.error')))
        }
        style={{ marginBottom: theme.spacing[3] }}
      />
      <Disclaimer />
    </Screen>
  );
}
