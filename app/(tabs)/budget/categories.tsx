/** Catégories : liste, enveloppes, ajout. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { categoryLabel } from '@/db/repositories';
import { useCategories } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents } from '@/utils/format';

export default function CategoriesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const categories = useCategories();
  return (
    <Screen>
      <SubScreenHeader
        title={t('budget.categories')}
        right={
          <IconButton
            name="Plus"
            accessibilityLabel={t('budget.addCategory')}
            filled
            onPress={() => router.push({ pathname: '/(tabs)/budget/categorie/[id]', params: { id: 'new' } })}
          />
        }
      />
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        {categories.map((c, i) => {
          const color = theme.chart[c.colorIndex % theme.chart.length] ?? theme.colors.brand;
          return (
            <ListRow
              key={c.id}
              icon={c.icon}
              iconColor={color}
              title={categoryLabel(c)}
              subtitle={
                c.budgetCents
                  ? `${t('budget.budgetAmount')} : ${formatCents(c.budgetCents, { compact: true })}`
                  : t('budget.noBudget')
              }
              chevron
              last={i === categories.length - 1}
              onPress={() => router.push({ pathname: '/(tabs)/budget/categorie/[id]', params: { id: c.id } })}
            />
          );
        })}
      </Card>
      <View style={{ marginTop: theme.spacing[3] }}>
        <Text variant="caption" color="textMuted">
          {t('budget.recurringHint')}
        </Text>
      </View>
    </Screen>
  );
}
