/** Point d'entrée : onboarding si jamais fait, sinon onglets. */
import React from 'react';
import { Redirect } from 'expo-router';

import { useSettings } from '@/store/settings';

export default function Index(): React.JSX.Element {
  const onboardingDone = useSettings((s) => s.onboardingDone);
  return <Redirect href={onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
