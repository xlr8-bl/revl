/**
 * Department room — community scoped to people in the same school +
 * department. Rooms are keyed `school:departmentId` so the backend can
 * map them to real channels later. Posts are mock and local for now;
 * the composer appends to local state.
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { communityFeed } from '../data/home';
import { useSession } from '../lib/session';
import { colors, fonts, spacing } from '../theme';

type Post = { id: string; user: string; initial: string; color: string; text: string; time: string };

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [draft, setDraft] = useState('');
  const [posts, setPosts] = useState<Post[]>(() =>
    communityFeed.map((f) => ({ id: f.id, user: f.user, initial: f.initial, color: f.color, text: `${f.action}: ${f.detail}`, time: f.time }))
  );

  if (!profile) return null;
  const roomName = `${profile.departmentName} · ${profile.school === 'ub' ? 'UB' : 'HND'}`;

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setPosts((p) => [
      { id: `p-${Date.now()}`, user: profile.name.split(' ')[0], initial: profile.name[0].toUpperCase(), color: profile.avatarColor, text, time: 'now' },
      ...p,
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={roomName} />
      <Text style={styles.memberLine}>128 classmates in this room</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: 16 }}>
        {posts.map((p, i) => (
          <View key={p.id} style={[styles.post, i > 0 && styles.postDivider]}>
            <View style={[styles.avatar, { backgroundColor: p.color }]}>
              <Text style={styles.avatarText}>{p.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.postHead}>
                <Text style={styles.postUser}>{p.user}</Text>
                <Text style={styles.postTime}>{p.time}</Text>
              </View>
              <Text style={styles.postText}>{p.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${profile.departmentName}…`}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={post}
        />
        <Pressable onPress={post} disabled={!draft.trim()} style={[styles.sendBtn, !draft.trim() && { opacity: 0.4 }]}>
          <Text style={styles.sendText}>Post</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  memberLine: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  post: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  postDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 15, color: '#141414' },
  postHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  postUser: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  postTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  postText: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, marginTop: 3 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.gutter,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  sendBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  sendText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.onAccent },
});
