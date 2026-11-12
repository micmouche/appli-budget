/** Avatars illustrés fournis par l'éditeur (20 personnages, WebP 512 px). */
import type { ImageSource } from 'expo-image';

export interface AvatarPreset {
  id: string;
  gender: 'female' | 'male';
  source: ImageSource | number;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar_female_01', gender: 'female', source: require('../../../assets/avatars/avatar_female_01.webp') },
  { id: 'avatar_female_02', gender: 'female', source: require('../../../assets/avatars/avatar_female_02.webp') },
  { id: 'avatar_female_03', gender: 'female', source: require('../../../assets/avatars/avatar_female_03.webp') },
  { id: 'avatar_female_04', gender: 'female', source: require('../../../assets/avatars/avatar_female_04.webp') },
  { id: 'avatar_female_05', gender: 'female', source: require('../../../assets/avatars/avatar_female_05.webp') },
  { id: 'avatar_female_06', gender: 'female', source: require('../../../assets/avatars/avatar_female_06.webp') },
  { id: 'avatar_female_07', gender: 'female', source: require('../../../assets/avatars/avatar_female_07.webp') },
  { id: 'avatar_female_08', gender: 'female', source: require('../../../assets/avatars/avatar_female_08.webp') },
  { id: 'avatar_female_09', gender: 'female', source: require('../../../assets/avatars/avatar_female_09.webp') },
  { id: 'avatar_female_10', gender: 'female', source: require('../../../assets/avatars/avatar_female_10.webp') },
  { id: 'avatar_male_01', gender: 'male', source: require('../../../assets/avatars/avatar_male_01.webp') },
  { id: 'avatar_male_02', gender: 'male', source: require('../../../assets/avatars/avatar_male_02.webp') },
  { id: 'avatar_male_03', gender: 'male', source: require('../../../assets/avatars/avatar_male_03.webp') },
  { id: 'avatar_male_04', gender: 'male', source: require('../../../assets/avatars/avatar_male_04.webp') },
  { id: 'avatar_male_05', gender: 'male', source: require('../../../assets/avatars/avatar_male_05.webp') },
  { id: 'avatar_male_06', gender: 'male', source: require('../../../assets/avatars/avatar_male_06.webp') },
  { id: 'avatar_male_07', gender: 'male', source: require('../../../assets/avatars/avatar_male_07.webp') },
  { id: 'avatar_male_08', gender: 'male', source: require('../../../assets/avatars/avatar_male_08.webp') },
  { id: 'avatar_male_09', gender: 'male', source: require('../../../assets/avatars/avatar_male_09.webp') },
  { id: 'avatar_male_10', gender: 'male', source: require('../../../assets/avatars/avatar_male_10.webp') },
];

export function avatarPreset(id: string | null | undefined): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((p) => p.id === id);
}
