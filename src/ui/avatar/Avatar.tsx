/** Avatar d'un membre du foyer : photo si définie, sinon avatar illustré, sinon initiale sur sa couleur. */
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import type { Person } from '@/db/schema';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from '../Text';
import { avatarPreset } from './presets';

export interface AvatarProps {
  person: Pick<Person, 'name' | 'avatarId' | 'photoUri' | 'colorIndex'> | null | undefined;
  size?: number;
  /** Anneau de la couleur du membre. */
  ring?: boolean;
}

export function personColor(colorIndex: number | null | undefined, palette: readonly string[]): string {
  return palette[(colorIndex ?? 0) % palette.length] ?? palette[0]!;
}

export function Avatar({ person, size = 32, ring = false }: AvatarProps): React.JSX.Element {
  const theme = useTheme();
  const color = personColor(person?.colorIndex, theme.chart);
  const inner = size - (ring ? 4 : 0);
  let content: React.ReactNode;
  if (person?.photoUri) {
    content = <Image source={{ uri: person.photoUri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} contentFit="cover" accessibilityLabel={person.name} />;
  } else if (avatarPreset(person?.avatarId)) {
    content = <Image source={avatarPreset(person?.avatarId)!.source} style={{ width: inner, height: inner, borderRadius: inner / 2 }} contentFit="cover" accessibilityLabel={person?.name} />;
  } else {
    content = (
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant={size >= 40 ? 'headline' : 'caption'} color="#FFFFFF" style={{ fontWeight: '700' }}>
          {(person?.name ?? '?').trim().charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: ring ? 2 : 0, borderColor: color, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={person?.name}>
      {content}
    </View>
  );
}

/** Deux avatars qui se chevauchent (le couple). */
export function AvatarGroup({ persons, size = 28 }: { persons: readonly AvatarProps['person'][]; size?: number }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {persons.map((p, i) => (
        <View key={p?.name ?? i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, borderWidth: 2, borderColor: theme.colors.bg, borderRadius: size / 2 + 2 }}>
          <Avatar person={p} size={size} />
        </View>
      ))}
    </View>
  );
}
