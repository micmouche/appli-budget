/** Sélecteur de périmètre : Tout · Commun · chaque membre (avatar). */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { Person } from '@/db/schema';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Text } from '@/ui/Text';
import { Avatar } from '@/ui/avatar/Avatar';

import { personScope, type Scope } from './scope';

export interface ScopeSelectorProps {
  persons: readonly Person[];
  value?: Scope;
  onChange?: (scope: Scope) => void;
}

export function ScopeSelector({ persons, value, onChange }: ScopeSelectorProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const theme = useTheme();
  const stored = useSettings((s) => s.scope);
  const set = useSettings((s) => s.set);
  const couple = useSettings((s) => s.couple);
  if (!couple) return null;
  const current = value ?? stored;
  const select = (scope: Scope): void => (onChange ? onChange(scope) : set('scope', scope));
  const pill = (key: string, scope: Scope, label: string, left: React.ReactNode): React.JSX.Element => {
    const selected = current === scope;
    return (
      <PressableScale
        key={key}
        onPress={() => select(scope)}
        haptic="selection"
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 38,
          paddingLeft: 6,
          paddingRight: 14,
          borderRadius: theme.radius.full,
          backgroundColor: selected ? theme.colors.text : theme.colors.surface,
          borderWidth: 1,
          borderColor: selected ? theme.colors.text : theme.colors.border,
        }}
      >
        {left}
        <Text variant="callout" color={selected ? 'bg' : 'text'}>
          {label}
        </Text>
      </PressableScale>
    );
  };
  const iconPill = (name: string, selected: boolean): React.JSX.Element => (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: selected ? 'rgba(255,255,255,0.16)' : theme.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={14} color={selected ? 'bg' : 'textSecondary'} strokeWidth={2} />
    </View>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {pill('all', 'all', t('budget.scope.all'), iconPill('LayoutGrid', current === 'all'))}
      {pill('shared', 'shared', t('budget.scope.shared'), iconPill('Users', current === 'shared'))}
      {persons.map((p) => pill(p.id, personScope(p.id), p.name, <Avatar person={p} size={26} />))}
    </ScrollView>
  );
}
