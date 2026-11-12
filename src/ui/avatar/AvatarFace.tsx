/** Avatar illustré (SVG), paramétré par un préréglage. */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { AVATAR_HAIR, AVATAR_SKINS, type AvatarSpec } from './presets';

const FRONT_HAIR: Record<AvatarSpec['hairStyle'], string> = {
  short: 'M36 56c0-18 10-28 24-28s24 10 24 28c-4-8-10-12-24-12s-20 4-24 12z',
  curly: 'M34 58c-4-22 10-34 26-34s30 12 26 34c-2-6-6-8-8-6-3-6-8-8-10-5-4-6-10-6-14-1-3-4-8-3-10 2-3-2-8 0-10 10z',
  long: 'M36 60c0-18 10-30 24-30s24 12 24 30c-6-10-12-14-24-14s-18 4-24 14z',
  wavy: 'M35 62c-2-20 10-32 25-32s27 12 25 32c-4-8-8-12-12-10-3-6-8-8-13-6-5-2-10 0-13 6-4-2-8 2-12 10z',
  bun: 'M36 58c0-16 10-26 24-26s24 10 24 26c-5-8-11-11-24-11s-19 3-24 11z',
  side: 'M36 58c0-18 10-28 24-28 16 0 26 10 26 26-6-4-12-6-18-6-8 0-10 4-14 6-6 2-12 0-18 2z',
  bald: '',
  buzz: 'M38 52c2-14 10-20 22-20s20 6 22 20c-5-5-12-7-22-7s-17 2-22 7z',
};

export function AvatarFace({ spec, size = 48 }: { spec: AvatarSpec; size?: number }): React.JSX.Element {
  const s = AVATAR_SKINS[spec.skin];
  const h = AVATAR_HAIR[spec.hair];
  const brow = spec.hair === 'grey' ? '#8A847A' : h;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityRole="image">
      <Circle cx={60} cy={60} r={60} fill={spec.bg} />
      <Path d="M35 118c0-14 10-22 25-22s25 8 25 22z" fill={s} />
      <Rect x={50} y={82} width={20} height={18} rx={6} fill={s} />
      {spec.hairStyle === 'long' || spec.hairStyle === 'wavy' ? <Path d="M30 60c0-24 12-38 30-38s30 14 30 38v34c0 4-4 6-8 6H38c-4 0-8-2-8-6z" fill={h} /> : null}
      {spec.hairStyle === 'bun' ? <Circle cx={60} cy={24} r={11} fill={h} /> : null}
      <Ellipse cx={60} cy={60} rx={24} ry={27} fill={s} />
      <Circle cx={36} cy={62} r={5} fill={s} />
      <Circle cx={84} cy={62} r={5} fill={s} />
      {FRONT_HAIR[spec.hairStyle] ? <Path d={FRONT_HAIR[spec.hairStyle]} fill={h} opacity={spec.hairStyle === 'buzz' ? 0.9 : 1} /> : null}
      <Path d="M48 54q5-3 10 0M62 54q5-3 10 0" stroke={brow} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Circle cx={52} cy={61} r={2.6} fill="#2B2320" />
      <Circle cx={68} cy={61} r={2.6} fill="#2B2320" />
      <Circle cx={53} cy={60} r={0.9} fill="#fff" />
      <Circle cx={69} cy={60} r={0.9} fill="#fff" />
      <Circle cx={47} cy={68} r={4} fill="#F28B82" opacity={0.35} />
      <Circle cx={73} cy={68} r={4} fill="#F28B82" opacity={0.35} />
      <Path d="M60 63v6l-2 1" stroke="#B5775A" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      {spec.smile === 'wide' ? <Path d="M52 74q8 7 16 0" stroke="#8C3D30" strokeWidth={2.4} strokeLinecap="round" fill="none" /> : null}
      {spec.smile === 'soft' ? <Path d="M54 74q6 4 12 0" stroke="#8C3D30" strokeWidth={2.2} strokeLinecap="round" fill="none" /> : null}
      {spec.smile === 'open' ? (
        <>
          <Path d="M51 73q9 10 18 0z" fill="#8C3D30" />
          <Path d="M55 76q5 3 10 0" fill="#fff" />
        </>
      ) : null}
      {spec.accessory === 'glasses' ? (
        <G fill="none" stroke="#2B2320" strokeWidth={2}>
          <Circle cx={52} cy={61} r={7} />
          <Circle cx={68} cy={61} r={7} />
          <Path d="M59 61h2M45 60l-6-2M75 60l6-2" />
        </G>
      ) : null}
      {spec.accessory === 'roundGlasses' ? (
        <G fill="none" stroke="#B5603A" strokeWidth={2}>
          <Circle cx={52} cy={61} r={6.5} />
          <Circle cx={68} cy={61} r={6.5} />
          <Path d="M58.5 61h3" />
        </G>
      ) : null}
      {spec.accessory === 'beard' ? <Path d="M40 66c2 16 10 24 20 24s18-8 20-24c-4 10-10 14-20 14s-16-4-20-14z" fill={h} opacity={0.9} /> : null}
      {spec.accessory === 'earrings' ? (
        <>
          <Circle cx={36} cy={69} r={2.5} fill="#E2B45A" />
          <Circle cx={84} cy={69} r={2.5} fill="#E2B45A" />
        </>
      ) : null}
      {spec.accessory === 'cap' ? (
        <>
          <Path d="M34 50c0-14 12-24 26-24s26 10 26 24z" fill="#2F6BBF" />
          <Path d="M34 50h56l6 6H30z" fill="#1F3A5F" />
        </>
      ) : null}
      {spec.accessory === 'headband' ? <Path d="M37 48q23-10 46 0" stroke="#E58AB4" strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
      {spec.accessory === 'moustache' ? <Path d="M52 70q4-3 8 0q4-3 8 0" stroke={h} strokeWidth={3} strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
}
