/** Identité du bailleur pour les quittances + délai d'alerte d'impayé. */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { FormField, Input, NumberInput } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { haptics } from '@/utils/haptics';

export default function LandlordScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useSettings();
  const [name, setName] = useState(settings.landlordName);
  const [address, setAddress] = useState(settings.landlordAddress);
  const [city, setCity] = useState(settings.landlordCity);
  const [grace, setGrace] = useState<number | null>(settings.rentalGraceDays);
  return (
    <Screen keyboard>
      <SubScreenHeader title={t('rental.landlord')} />
      <Card>
        <FormField label={t('rental.landlordName')}>
          <Input value={name} onChangeText={setName} placeholder="Thomas Martin" />
        </FormField>
        <FormField label={t('rental.landlordAddress')}>
          <Input value={address} onChangeText={setAddress} placeholder="5 rue de la Paix, 44000 Nantes" />
        </FormField>
        <FormField label="Ville (pour « Fait à »)">
          <Input value={city} onChangeText={setCity} placeholder="Nantes" />
        </FormField>
        <FormField label={t('rental.graceDays')}>
          <NumberInput value={grace} onChange={setGrace} suffix={t('rental.graceDaysUnit')} integer />
        </FormField>
        <Button
          label={t('common.save')}
          onPress={() => {
            settings.patch({
              landlordName: name.trim(),
              landlordAddress: address.trim(),
              landlordCity: city.trim(),
              rentalGraceDays: Math.max(0, Math.min(30, grace ?? 5)),
            });
            haptics.success();
            router.back();
          }}
        />
      </Card>
    </Screen>
  );
}
