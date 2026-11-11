/** Champs de formulaire : libellé, aide, erreur ; saisie texte, montant, pourcentage. */
import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import type { Cents } from '@/finance/money';
import { parseEurosInput } from '@/finance/money';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamilies } from '@/theme/typography';

import { Text } from './Text';

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, error, children }: FormFieldProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing[4] }}>
      <Text variant="callout" color="textSecondary" style={{ marginBottom: theme.spacing[2] }}>
        {label}
      </Text>
      {children}
      {error ? (
        <Text variant="caption" color="negative" style={{ marginTop: theme.spacing[1] }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing[1] }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export interface InputProps extends TextInputProps {
  suffix?: string;
  invalid?: boolean;
}

export function Input({ suffix, invalid, style, ...rest }: InputProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.inputWrap,
        {
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radius.sm,
          borderColor: invalid ? theme.colors.negative : 'transparent',
        },
      ]}
    >
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        {...rest}
        style={[styles.input, { color: theme.colors.text, fontFamily: fontFamilies.body }, style]}
      />
      {suffix ? (
        <Text variant="callout" color="textSecondary" style={{ marginRight: theme.spacing[3] }}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

export interface CurrencyInputProps {
  valueCents: Cents | null;
  onChangeCents: (cents: Cents | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Saisie d'un montant en euros (clavier décimal), stockage en centimes. */
export function CurrencyInput({
  valueCents,
  onChangeCents,
  placeholder = '0,00',
  autoFocus,
}: CurrencyInputProps): React.JSX.Element {
  const [text, setText] = React.useState(
    valueCents === null ? '' : (valueCents / 100).toFixed(2).replace('.', ','),
  );
  return (
    <Input
      value={text}
      onChangeText={(t) => {
        setText(t);
        onChangeCents(parseEurosInput(t));
      }}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      suffix="€"
      autoFocus={autoFocus}
      invalid={text !== '' && parseEurosInput(text) === null}
      accessibilityLabel="Montant en euros"
    />
  );
}

export interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  integer?: boolean;
  placeholder?: string;
}

export function NumberInput({
  value,
  onChange,
  suffix,
  integer,
  placeholder,
}: NumberInputProps): React.JSX.Element {
  const [text, setText] = React.useState(value === null ? '' : String(value).replace('.', ','));
  return (
    <Input
      value={text}
      onChangeText={(t) => {
        setText(t);
        const cleaned = t.replace(',', '.').trim();
        if (cleaned === '') return onChange(null);
        const n = Number(cleaned);
        onChange(Number.isFinite(n) ? (integer ? Math.round(n) : n) : null);
      }}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      suffix={suffix}
      placeholder={placeholder}
    />
  );
}

const styles = StyleSheet.create({
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 48 },
  input: { flex: 1, fontSize: 17, paddingHorizontal: 14, paddingVertical: 12 },
});
