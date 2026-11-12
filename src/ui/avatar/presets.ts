/** Avatars illustrés : paramètres partagés avec la maquette (scratch gen.js). */
export const AVATAR_SKINS = { light: '#F6D7C3', medium: '#E0A98A', tan: '#C98A62', brown: '#9C6644', deep: '#6B4226' } as const;
export const AVATAR_HAIR = { black: '#2B2320', brown: '#6B4A32', blond: '#E2B45A', red: '#C7542B', grey: '#B8B2A7', pink: '#E58AB4' } as const;
export const AVATAR_BG = ['#FFD9C2', '#DCD6FA', '#CDEBDD', '#FBE6B5', '#F9D6E1', '#D7E6FB', '#E6E1D6', '#C9EDE8'] as const;

export type AvatarSkin = keyof typeof AVATAR_SKINS;
export type AvatarHair = keyof typeof AVATAR_HAIR;
export type AvatarHairStyle = 'short' | 'curly' | 'long' | 'wavy' | 'bun' | 'side' | 'bald' | 'buzz';
export type AvatarAccessory = 'none' | 'glasses' | 'roundGlasses' | 'beard' | 'earrings' | 'cap' | 'headband' | 'moustache';
export type AvatarSmile = 'wide' | 'open' | 'soft';

export interface AvatarSpec {
  id: string;
  skin: AvatarSkin;
  hair: AvatarHair;
  hairStyle: AvatarHairStyle;
  bg: string;
  accessory: AvatarAccessory;
  smile: AvatarSmile;
}

export const AVATAR_PRESETS: AvatarSpec[] = [
  { id: 'f1', skin: 'light', hair: 'brown', hairStyle: 'long', bg: AVATAR_BG[0], accessory: 'earrings', smile: 'wide' },
  { id: 'f2', skin: 'medium', hair: 'black', hairStyle: 'bun', bg: AVATAR_BG[1], accessory: 'roundGlasses', smile: 'soft' },
  { id: 'f3', skin: 'tan', hair: 'red', hairStyle: 'wavy', bg: AVATAR_BG[2], accessory: 'none', smile: 'open' },
  { id: 'f4', skin: 'deep', hair: 'black', hairStyle: 'curly', bg: AVATAR_BG[3], accessory: 'earrings', smile: 'wide' },
  { id: 'f5', skin: 'light', hair: 'blond', hairStyle: 'side', bg: AVATAR_BG[4], accessory: 'headband', smile: 'soft' },
  { id: 'f6', skin: 'brown', hair: 'pink', hairStyle: 'short', bg: AVATAR_BG[5], accessory: 'glasses', smile: 'open' },
  { id: 'm1', skin: 'light', hair: 'brown', hairStyle: 'short', bg: AVATAR_BG[5], accessory: 'none', smile: 'wide' },
  { id: 'm2', skin: 'medium', hair: 'black', hairStyle: 'buzz', bg: AVATAR_BG[2], accessory: 'beard', smile: 'soft' },
  { id: 'm3', skin: 'tan', hair: 'blond', hairStyle: 'side', bg: AVATAR_BG[6], accessory: 'glasses', smile: 'open' },
  { id: 'm4', skin: 'deep', hair: 'black', hairStyle: 'curly', bg: AVATAR_BG[0], accessory: 'none', smile: 'wide' },
  { id: 'm5', skin: 'brown', hair: 'grey', hairStyle: 'bald', bg: AVATAR_BG[7], accessory: 'moustache', smile: 'soft' },
  { id: 'm6', skin: 'light', hair: 'red', hairStyle: 'short', bg: AVATAR_BG[3], accessory: 'cap', smile: 'open' },
];

export function avatarPreset(id: string | null | undefined): AvatarSpec {
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0]!;
}
