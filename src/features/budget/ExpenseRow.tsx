/** Ligne de dépense : icône de catégorie, libellé, note / payeur, montant. */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryLabel } from '@/db/repositories';
import type { Category, Expense, Person } from '@/db/schema';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Text } from '@/ui/Text';
import { Avatar } from '@/ui/avatar/Avatar';

export interface ExpenseRowProps {
  expense: Expense;
  category: Category | undefined;
  persons: readonly Person[];
  showPayer: boolean;
  onPress: () => void;
  last?: boolean;
}

export function ExpenseRow({
  expense,
  category,
  persons,
  showPayer,
  onPress,
  last,
}: ExpenseRowProps): React.JSX.Element {
  const theme = useTheme();
  const color = category
    ? (theme.chart[category.colorIndex % theme.chart.length] ?? theme.colors.brand)
    : theme.colors.textMuted;
  const label = category ? categoryLabel(category) : '?';
  const payerPerson = showPayer ? persons.find((p) => p.id === expense.paidById) : undefined;
  const payer = payerPerson?.name;
  const subtitle = [expense.note, payer, expense.recurringId ? '↻' : null].filter(Boolean).join(' · ');
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${subtitle}`}
    >
      <View
        style={[
          styles.row,
          {
            paddingVertical: theme.spacing[3],
            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: `${color}1F` }]}>
          <Icon name={category?.icon ?? 'CircleEllipsis'} color={color} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline" numberOfLines={1}>
            {label}
          </Text>
          {subtitle ? (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Amount cents={expense.amountCents} asExpense variant="headline" />
          {payerPerson ? <Avatar person={payerPerson} size={18} /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
