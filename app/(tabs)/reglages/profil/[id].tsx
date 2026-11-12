/** Profil d'un membre : prénom, avatar illustré ou photo, couleur. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { updateProfile } from '@/db/repositories';
import { usePersons } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from '@/ui/avatar/Avatar';
import { AvatarFace } from '@/ui/avatar/AvatarFace';
import { AVATAR_PRESETS } from '@/ui/avatar/presets';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { FormField, Input } from '@/ui/Form';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { haptics } from '@/utils/haptics';

export default function ProfileScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const persons = usePersons();
  const person = persons.find((p) => p.id === id) ?? persons[0];
  const [name, setName] = useState(person?.name ?? '');
  const [avatarId, setAvatarId] = useState<string | null>(person?.avatarId ?? null);
  const [photoUri, setPhotoUri] = useState<string | null>(person?.photoUri ?? null);
  const [colorIndex, setColorIndex] = useState(person?.colorIndex ?? 1);
  if (!person) {
    return (
      <Screen>
        <SubScreenHeader title={t('profile.title')} />
      </Screen>
    );
  }

  const pickPhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast(t('profile.photoPermission'), { icon: 'Info' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const src = new File(result.assets[0].uri);
    const dest = new File(Paths.document, `profile-${person.id}-${Date.now()}.jpg`);
    src.copy(dest);
    setPhotoUri(dest.uri);
    setAvatarId(null);
    haptics.success();
  };

  const save = (): void => {
    updateProfile(person.id, { name: name.trim() || person.name, avatarId, photoUri, colorIndex });
    haptics.success();
    router.back();
  };

  const preview = { name, avatarId, photoUri, colorIndex };

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('profile.title')} />
      <View style={{ alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
        <View style={{ borderRadius: 60, borderWidth: 4, borderColor: theme.colors.surface, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 }}>
          <Avatar person={preview} size={108} />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
          <Button label={t('profile.photo')} icon="Camera" variant="secondary" size="sm" onPress={() => void pickPhoto()} />
          {photoUri ? <Button label={t('profile.removePhoto')} variant="ghost" size="sm" onPress={() => setPhotoUri(null)} /> : null}
        </View>
      </View>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <FormField label={t('budget.personName')}>
          <Input value={name} onChangeText={setName} />
        </FormField>
        <Text variant="micro" color="textMuted" style={{ marginBottom: theme.spacing[2] }}>
          {t('profile.chooseAvatar')}
        </Text>
        <View style={styles.grid}>
          {AVATAR_PRESETS.map((p) => {
            const on = avatarId === p.id && !photoUri;
            return (
              <PressableScale
                key={p.id}
                onPress={() => {
                  setAvatarId(p.id);
                  setPhotoUri(null);
                }}
                haptic="selection"
                scaleTo={0.92}
                accessibilityRole="radio"
                accessibilityLabel={`Avatar ${p.id}`}
                accessibilityState={{ selected: on }}
                style={{ borderRadius: 40, borderWidth: 3, borderColor: on ? theme.colors.brand : 'transparent', padding: 2 }}
              >
                <AvatarFace spec={p} size={62} />
              </PressableScale>
            );
          })}
        </View>
        <Text variant="micro" color="textMuted" style={{ marginTop: theme.spacing[4], marginBottom: theme.spacing[2] }}>
          {t('profile.myColor')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {theme.chart.map((c, i) => (
            <PressableScale key={c} onPress={() => setColorIndex(i)} haptic="selection" accessibilityRole="radio" accessibilityState={{ selected: i === colorIndex }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: 3, borderColor: i === colorIndex ? theme.colors.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {i === colorIndex ? <Icon name="Check" color="#FFFFFF" size={16} strokeWidth={3} /> : null}
            </PressableScale>
          ))}
        </View>
        <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing[2] }}>
          {t('profile.colorHint')}
        </Text>
      </Card>
      <Button label={t('common.save')} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' } });
