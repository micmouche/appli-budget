/** Pastille de statut d'une échéance (icône + libellé, jamais couleur seule). */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

import type { PaymentStatus } from './logic';

export function StatusBadge({ status }: { status: PaymentStatus }): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const map = {
    paid: { color: theme.colors.positive, icon: 'CircleCheck', label: t('rental.statusPaid') },
    partial: { color: theme.colors.warning, icon: 'CircleDashed', label: t('rental.statusPartial') },
    late: { color: theme.colors.negative, icon: 'CircleExclamationPoint', label: t('rental.statusLate') },
    pending: { color: theme.colors.textMuted, icon: 'Clock', label: t('rental.statusPending') },
  }[status];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${map.color}1F`,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Icon name={map.icon} color={map.color} size={14} />
      <Text variant="micro" color={map.color}>
        {map.label}
      </Text>
    </View>
  );
}
