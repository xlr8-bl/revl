/**
 * Edit profile — the account details a student can fix after onboarding:
 * name, username (with availability), avatar color, and their level
 * (a common registration mistake). Saves straight to the session.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { schools } from '../../data/catalog';
import { AVATAR_COLORS, isUsernameAvailable, updateProfile, useSession } from '../../lib/session';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion } from '../../theme';

export default function EditProfileScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useSession();

  const [name, setName] = useState(profile?.name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [avatarColor] = useState(profile?.avatarColor ?? AVATAR_COLORS[0]);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatarUri);
  const [level, setLevel] = useState(profile?.level ?? '');

  if (!profile) return null;
  const levels = schools.find((s) => s.id === profile.school)?.levels ?? [];

  const usernameOk = username === profile.username || isUsernameAvailable(username);
  const canSave = name.trim().length > 1 && usernameOk;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    }).catch(() => null);
    if (res && !res.canceled && res.assets?.[0]) setAvatarUri(res.assets[0].uri);
  };

  const save = () => {
    if (!canSave) return;
    updateProfile({ name: name.trim(), username: username.trim().toLowerCase(), avatarColor, avatarUri, level });
    router.back();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Edit profile</Text>
        <Pressable onPress={save} hitSlop={10} disabled={!canSave}>
          <Text style={[styles.save, !canSave && { color: colors.textTertiary }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: spacing.gutter }}>
        {/* Avatar. Tap to change photo */}
        <View style={styles.avatarWrap}>
          <Pressable onPress={pickPhoto}>
            <Avatar uri={avatarUri} useDefault color={avatarColor} initial={name[0]} size={88} />
            <View style={styles.photoBadge}>
              <Ionicons name="camera" size={15} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
        <View style={styles.photoActions}>
          <Pressable onPress={pickPhoto}>
            <Text style={styles.photoBtn}>Change photo</Text>
          </Pressable>
          {avatarUri && (
            <Pressable onPress={() => setAvatarUri(undefined)}>
              <Text style={styles.photoRemove}>Use default</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your name" placeholderTextColor={colors.textTertiary} />

        <Text style={styles.label}>Username</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.at}>@</Text>
          <TextInput
            value={username}
            onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
            style={[styles.input, { flex: 1, marginTop: 0 }]}
            placeholder="username"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
          />
        </View>
        {!usernameOk && username.length > 0 && <Text style={styles.err}>That username is taken.</Text>}

        {levels.length > 1 && (
          <>
            <Text style={styles.label}>Level</Text>
            <View style={styles.chipRow}>
              {levels.map((l) => (
                <Pressable key={l} onPress={() => setLevel(l)} style={[styles.chip, level === l && styles.chipActive]}>
                  <Text style={[styles.chipText, level === l && { color: colors.onAccent }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>Registered at the wrong level? Fix it here, then update your courses.</Text>
          </>
        )}

        <View style={styles.readonly}>
          <Text style={styles.roLabel}>{profile.school === 'ub' ? 'University of Buea' : 'HND'}</Text>
          <Text style={styles.roValue}>{profile.departmentName}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    backBtn: { width: 40, alignItems: 'center' },
    topTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
    save: { fontFamily: fonts.bold, fontSize: 16, color: colors.accent },
    avatarWrap: { alignItems: 'center', marginTop: 16 },
    photoBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.bg,
    },
    photoActions: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 12 },
    photoBtn: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.accent },
    photoRemove: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
    label: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary, marginTop: 24, marginBottom: 8 },
    input: {
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.text,
    },
    usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    at: { fontFamily: fonts.bold, fontSize: 18, color: colors.textSecondary },
    err: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.danger, marginTop: 6 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.card,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
    hint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 8 },
    readonly: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 16,
      marginTop: 26,
    },
    roLabel: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
    roValue: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, marginTop: 3 },
  });
const styles = themedStyleSheet(makeStyles);
