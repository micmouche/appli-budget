/** Import d'un relevé bancaire (CSV / OFX) : lecture, catégorisation, anti-doublon, aperçu, validation. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import {
  categoryLabel,
  createExpense,
  existingImportKeys,
  loadImportRules,
  saveImportRule,
} from '@/db/repositories';
import { OTHER_CATEGORY_ID } from '@/db/defaultCategories';
import { getDb } from '@/db/client';
import { useCategories, usePersons } from '@/features/budget/hooks';
import { categorize, learningKey } from '@/features/budget/import/categorize';
import { parseStatement, type BankTransaction } from '@/features/budget/import/parse';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatRelativeDay } from '@/utils/format';
import { haptics } from '@/utils/haptics';

interface Row {
  tx: BankTransaction;
  categoryId: string;
  source: 'learned' | 'keyword' | 'fallback';
  include: boolean;
  duplicate: boolean;
}

export default function ImportScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const categories = useCategories();
  const persons = usePersons();
  const couple = useSettings((s) => s.couple);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [credits, setCredits] = useState(0);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(true);
  const [paidById, setPaidById] = useState<string | null>(persons[0]?.id ?? null);
  const [editing, setEditing] = useState<string | null>(null);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const pick = async (): Promise<void> => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/x-ofx', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets[0]) return;
    setBusy(true);
    try {
      const text = await new File(picked.assets[0].uri).text();
      const all = parseStatement(text);
      if (all.length === 0) {
        showToast(
          /[;,\t]/.test(text) || /<OFX>/i.test(text) ? t('budget.import.none') : t('budget.import.invalid'),
          { icon: 'CircleExclamationPoint' },
        );
        return;
      }
      const debits = all.filter((x) => x.amountCents < 0);
      setCredits(all.length - debits.length);
      const learned = loadImportRules(getDb());
      const existing = existingImportKeys(
        debits.map((d) => d.key),
        getDb(),
      );
      setRows(
        debits.map((tx) => {
          const c = categorize({ label: tx.label, learned, fallback: OTHER_CATEGORY_ID });
          const duplicate = existing.has(tx.key);
          return {
            tx,
            categoryId: categoryById.has(c.categoryId) ? c.categoryId : OTHER_CATEGORY_ID,
            source: c.source,
            include: !duplicate,
            duplicate,
          };
        }),
      );
    } catch {
      showToast(t('common.error'), { icon: 'CircleExclamationPoint' });
    } finally {
      setBusy(false);
    }
  };

  const doImport = (): void => {
    if (!rows) return;
    const selected = rows.filter((r) => r.include);
    getDb().$client.withTransactionSync(() => {
      for (const r of selected) {
        createExpense({
          amountCents: -r.tx.amountCents,
          categoryId: r.categoryId,
          date: r.tx.date,
          paidById,
          shared,
          note: r.tx.label.slice(0, 80),
          importKey: r.tx.key,
        });
        if (r.source !== 'learned') saveImportRule(learningKey(r.tx.label), r.categoryId);
      }
    });
    haptics.success();
    showToast(t('budget.import.done', { count: selected.length }));
    router.back();
  };

  const setCategory = (key: string, categoryId: string): void => {
    setRows(
      (cur) => cur?.map((r) => (r.tx.key === key ? { ...r, categoryId, source: 'learned' } : r)) ?? null,
    );
    setEditing(null);
  };
  const toggle = (key: string): void =>
    setRows((cur) => cur?.map((r) => (r.tx.key === key ? { ...r, include: !r.include } : r)) ?? null);
  const selectedCount = rows?.filter((r) => r.include).length ?? 0;
  const duplicates = rows?.filter((r) => r.duplicate).length ?? 0;

  return (
    <Screen bottomInset={rows ? 72 : 0}>
      <SubScreenHeader title={t('budget.import.title')} />
      {!rows ? (
        <Card>
          <EmptyState icon="FileUp" title={t('budget.import.title')} body={t('budget.import.hint')} compact />
          <Button
            label={t('budget.import.pick')}
            icon="FolderOpen"
            onPress={() => void pick()}
            loading={busy}
          />
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: theme.spacing[3] }}>
            <Text variant="headline">{t('budget.import.found', { count: rows.length + credits })}</Text>
            <Text variant="caption" color="textSecondary">
              {t('budget.import.debits', { count: rows.length })} ·{' '}
              {t('budget.import.credits', { count: credits })}
              {duplicates ? ` · ${t('budget.import.duplicates', { count: duplicates })}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: theme.spacing[3] }}>
              <Chip
                label={t('budget.import.all')}
                onPress={() => setRows((cur) => cur?.map((r) => ({ ...r, include: !r.duplicate })) ?? null)}
              />
              <Chip
                label={t('budget.import.nothing')}
                onPress={() => setRows((cur) => cur?.map((r) => ({ ...r, include: false })) ?? null)}
              />
              {couple ? (
                <>
                  <Chip
                    label={shared ? t('budget.shared') : t('budget.personal')}
                    icon={shared ? 'Users' : 'User'}
                    selected={shared}
                    onPress={() => setShared((v) => !v)}
                  />
                  {persons.map((p) => (
                    <Chip
                      key={p.id}
                      label={p.name}
                      icon="User"
                      selected={paidById === p.id}
                      onPress={() => setPaidById(p.id)}
                    />
                  ))}
                </>
              ) : null}
            </View>
          </Card>
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
            {rows.map((r, i) => {
              const cat = categoryById.get(r.categoryId);
              const color = cat
                ? (theme.chart[cat.colorIndex % theme.chart.length] ?? theme.colors.brand)
                : theme.colors.textMuted;
              return (
                <View
                  key={r.tx.key}
                  style={{
                    paddingVertical: theme.spacing[3],
                    borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.border,
                    opacity: r.include ? 1 : 0.45,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                    <PressableScale
                      onPress={() => toggle(r.tx.key)}
                      haptic="selection"
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: r.include }}
                      hitSlop={8}
                    >
                      <Icon
                        name={r.include ? 'SquareCheck' : 'Square'}
                        color={r.include ? theme.colors.brand : theme.colors.textMuted}
                        size={22}
                      />
                    </PressableScale>
                    <View style={{ flex: 1 }}>
                      <Text variant="callout" numberOfLines={1}>
                        {r.tx.label || '—'}
                      </Text>
                      <Text variant="caption" color={r.duplicate ? 'warning' : 'textSecondary'}>
                        {formatRelativeDay(r.tx.date)}
                        {r.duplicate ? ` · ${t('budget.import.alreadyImported')}` : ''}
                      </Text>
                    </View>
                    <Amount cents={r.tx.amountCents} variant="headline" />
                  </View>
                  <View style={{ marginTop: 8, marginLeft: 34 }}>
                    {editing === r.tx.key ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {categories.map((c) => (
                          <Chip
                            key={c.id}
                            label={categoryLabel(c)}
                            icon={c.icon}
                            color={theme.chart[c.colorIndex % theme.chart.length]}
                            selected={c.id === r.categoryId}
                            onPress={() => setCategory(r.tx.key, c.id)}
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row' }}>
                        <Chip
                          label={cat ? categoryLabel(cat) : '?'}
                          icon={cat?.icon}
                          color={color}
                          selected
                          onPress={() => setEditing(r.tx.key)}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
          <Button
            label={t('budget.import.importButton', { count: selectedCount })}
            icon="Check"
            disabled={selectedCount === 0}
            onPress={doImport}
            style={{ marginTop: theme.spacing[4] }}
          />
          <Button
            label={t('budget.import.pick')}
            variant="ghost"
            onPress={() => void pick()}
            style={{ marginTop: theme.spacing[2] }}
          />
        </>
      )}
    </Screen>
  );
}
