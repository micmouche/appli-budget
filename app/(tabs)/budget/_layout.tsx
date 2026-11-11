import React from 'react';
import { Stack } from 'expo-router';

export default function BudgetLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
