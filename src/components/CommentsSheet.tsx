/**
 * CommentsSheet — real replies for a post. Lists every comment (avatar,
 * name, body, time) and a sticky composer at the bottom. Adds land in
 * the community store immediately and re-rank the count on the card.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { addComment, useCommunity } from '../lib/communityStore';
import { useSession } from '../lib/session';
import { colors, fonts } from '../theme';
import { BottomSheet } from './BottomSheet';

export function CommentsSheet({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const { posts } = useCommunity();
  const { profile } = useSession();
  const [text, setText] = useState('');
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  const send = () => {
    if (!text.trim() || !profile) return;
    addComment(postId, text, {
      name: profile.name.split(' ')[0],
      initial: profile.name[0].toUpperCase(),
      color: profile.avatarColor,
    });
    setText('');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>
        {post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'}
      </Text>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {post.comments.length === 0 ? (
          <Text style={styles.empty}>No replies yet. Be the first to help.</Text>
        ) : (
          post.comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={[styles.avatar, { backgroundColor: c.author.color }]}>
                <Text style={styles.avatarText}>{c.author.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentHead}>
                  {c.author.name} <Text style={styles.commentTime}>· {c.time}</Text>
                </Text>
                <Text style={styles.commentBody}>{c.text}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a reply…"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          multiline
          onSubmitEditing={send}
        />
        <Pressable onPress={send} disabled={!text.trim()} hitSlop={8} style={styles.sendBtn}>
          <Ionicons name="arrow-up" size={20} color={text.trim() ? colors.onAccent : colors.textTertiary} />
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, marginBottom: 12 },
  list: { maxHeight: 380 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textTertiary, paddingVertical: 20, textAlign: 'center' },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 13, color: '#141414' },
  commentHead: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  commentTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary },
  commentBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 2 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14.5,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
