/** Champ date simple : saisie « JJ/MM/AAAA » avec raccourcis Aujourd'hui / Hier. */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { isValid, parse, format as dfFormat, subDays } from 'date-fns';

import { Chip } from '@/ui/Chip';
import { Input } from '@/ui/Form';
import { fromIsoDate, toIsoDate } from '@/utils/format';

export interface DateFieldProps {
  /** ISO AAAA-MM-JJ */
  value: string;
  onChange: (iso: string) => void;
}

export function DateField({ value, onChange }: DateFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const [text, setText] = useState(value ? dfFormat(fromIsoDate(value), 'dd/MM/yyyy') : '');
  const commit = (raw: string): void => {
    setText(raw);
    const parsed = parse(raw, 'dd/MM/yyyy', new Date());
    if (isValid(parsed) && raw.length === 10) onChange(toIsoDate(parsed));
  };
  const setDate = (d: Date): void => {
    setText(dfFormat(d, 'dd/MM/yyyy'));
    onChange(toIsoDate(d));
  };
  return (
    <View style={{ gap: 8 }}>
      <Input
        value={text}
        onChangeText={commit}
        placeholder="JJ/MM/AAAA"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        invalid={text.length === 10 && !isValid(parse(text, 'dd/MM/yyyy', new Date()))}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label={t('common.today')}
          onPress={() => setDate(new Date())}
          selected={value === toIsoDate(new Date())}
        />
        <Chip
          label={t('common.yesterday')}
          onPress={() => setDate(subDays(new Date(), 1))}
          selected={value === toIsoDate(subDays(new Date(), 1))}
        />
      </View>
    </View>
  );
}
