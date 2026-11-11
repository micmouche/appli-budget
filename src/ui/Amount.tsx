/** Montant formaté en chiffres tabulaires, couleur selon le signe, label VoiceOver en toutes lettres. */
import React from 'react';

import type { Cents } from '@/finance/money';
import type { TypeStyle } from '@/theme/typography';
import { centsAccessibilityLabel, formatCents } from '@/utils/format';

import { Text, type TextProps } from './Text';

export interface AmountProps extends Omit<TextProps, 'children' | 'variant'> {
  cents: Cents;
  variant?: TypeStyle;
  /** Colore selon le signe (positif vert, négatif rouge). */
  colored?: boolean;
  signed?: boolean;
  compact?: boolean;
  /** Affiche les dépenses (positives en base) comme des sorties « − ». */
  asExpense?: boolean;
}

export function Amount({
  cents,
  variant = 'headline',
  colored = false,
  signed = false,
  compact = false,
  asExpense = false,
  color,
  ...rest
}: AmountProps): React.JSX.Element {
  const value = asExpense ? -cents : cents;
  const tone = colored ? (value < 0 ? 'negative' : value > 0 ? 'positive' : 'text') : (color ?? 'text');
  return (
    <Text
      variant={variant}
      tabular
      color={tone}
      accessibilityLabel={centsAccessibilityLabel(value)}
      {...rest}
    >
      {formatCents(value, { signed, compact })}
    </Text>
  );
}
