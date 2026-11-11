/** Texte thématisé : style de l'échelle typographique + couleur sémantique + plafond d'échelle. */
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { maxFontScale, tabularNums, type TypeStyle } from '@/theme/typography';
import type { ColorTokens } from '@/theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: TypeStyle;
  color?: keyof ColorTokens | string;
  tabular?: boolean;
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  color = 'text',
  tabular,
  align,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const theme = useTheme();
  const resolved = (theme.colors as unknown as Record<string, string>)[color] ?? color;
  return (
    <RNText
      maxFontSizeMultiplier={maxFontScale[variant]}
      {...rest}
      style={[
        theme.type[variant],
        { color: resolved },
        tabular ? tabularNums : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
