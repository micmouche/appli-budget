/** Compte : création / édition / suppression (opérations déplacées). */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { countOperationsInAccount, createAccount, deleteAccount, getAccount, setDefaultAccount, updateAccount } from '@/db/repositories';
import { ACCOUNT_TYPES, type AccountType } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { ACCOUNT_ICONS } from '@/features/budget/AccountsStrip';
import { useAccounts, usePersons } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { haptics } from '@/utils/haptics';

export default function AccountEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getAccount(id)), [id, isNew]);
  const persons = usePersons();
  const { accounts } = useAccounts();
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<AccountType>(existing?.type ?? 'checking');
  const [ownerId, setOwnerId] = useState<string | null>(existing?.ownerId ?? null);
  const [initial, setInitial] = useState<number | null>(existing?.initialBalanceCents ?? null);
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 0);
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? accounts.length === 0);

  const save = (): void => {
    if (!name.trim()) {
      haptics.error();
      return;
    }
    const input = { name, type, ownerId, initialBalanceCents: initial ?? 0, colorIndex };
    const row = isNew ? createAccount(input) : (updateAccount(id, input), { id });
    if (isDefault) setDefaultAccount(row.id);
    haptics.success();
    router.back();
  };
  const remove = (): void => {
    const others = accounts.filter((a) => a.account.id !== id);
    if (others.length === 0) return;
    const count = countOperationsInAccount(id);
    const target = others.find((a) => a.account.isDefault) ?? others[0]!;
    Alert.alert(t('common.confirmDeleteTitle'), count > 0 ? t('budget.accounts.deleteWithOps', { count, target: target.account.name }) : t('common.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { deleteAccount(id, target.account.id); router.dismissTo('/(tabs)/budget'); } },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('budget.accounts.addAccount') : t('budget.accounts.editAccount')} />
      <Card>
        <FormField label={t('budget.accounts.type')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ACCOUNT_TYPES.map((x) => (
              <Chip key={x} label={t(`budget.accounts.types.${x}`)} icon={ACCOUNT_ICONS[x]} selected={type === x} onPress={() => { setType(x); if (isNew && !name) setName(t(`budget.accounts.types.${x}`)); }} />
            ))}
          </View>
        </FormField>
        <FormField label={t('budget.accounts.name')}>
          <Input value={name} onChangeText={setName} placeholder={t('budget.accounts.types.checking')} />
        </FormField>
        {persons.length > 1 ? (
          <FormField label={t('budget.accounts.owner')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label={t('budget.accounts.ownerShared')} icon="Users" selected={ownerId === null} onPress={() => setOwnerId(null)} />
              {persons.map((p) => (
                <Chip key={p.id} label={p.name} icon="User" selected={ownerId === p.id} onPress={() => setOwnerId(p.id)} />
              ))}
            </View>
          </FormField>
        ) : null}
        <FormField label={t('budget.accounts.initialBalance')} hint={t('budget.accounts.initialBalanceHint')}>
          <CurrencyInput valueCents={initial} onChangeCents={setInitial} />
        </FormField>
        <FormField label={t('budget.categoryColor')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {theme.chart.map((c, i) => (
              <Chip key={c} label=" " color={c} selected={i === colorIndex} onPress={() => setColorIndex(i)} />
            ))}
          </View>
        </FormField>
        <ListRow title={t('budget.accounts.defaultAccount')} last right={<Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: theme.colors.brand }} accessibilityLabel={t('budget.accounts.defaultAccount')} />} />
        <Button label={t('common.save')} onPress={save} style={{ marginTop: theme.spacing[3] }} />
        {!isNew && accounts.length > 1 ? <Button label={t('common.delete')} variant="destructive" onPress={remove} style={{ marginTop: theme.spacing[2] }} /> : null}
      </Card>
    </Screen>
  );
}
