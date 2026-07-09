/**
 * PostCard — one community post: author row, body, optional snapped
 * solution photo, optional QuestionAnchor, and the action row
 * (upvote as "useful", comments, share). Solve posts that crossed the
 * community threshold carry the verified tag — those answers get
 * promoted into the paper itself.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { toggleUpvote, type CommunityPost } from '../lib/communityStore';
import { colors, fonts } from '../theme';
import { QuestionAnchor } from './QuestionAnchor';

export function PostCard({ post }: { post: CommunityPost }) {
  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: post.author.color }]}>
          <Text style={styles.avatarText}>{post.author.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>
            {post.author.name} <Text style={styles.authorMeta}>· {post.author.level} · {post.time}</Text>
          </Text>
          <Text style={styles.kind}>
            {post.kind === 'solve' ? 'posted a solution' : 'asked the class'}
            {post.courseCode ? ` · ${post.courseCode}` : ''}
          </Text>
        </View>
        {post.communityVerified && (
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedText}>✓ Class verified</Text>
          </View>
        )}
      </View>

      <Text style={styles.body}>{post.text}</Text>

      {post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.snap} resizeMode="cover" />}

      {post.questionRef && post.courseCode && <QuestionAnchor refr={post.questionRef} courseCode={post.courseCode} />}

      {/* Action row */}
      <View style={styles.actions}>
        <Pressable onPress={() => toggleUpvote(post.id)} hitSlop={8} style={styles.action}>
          <Text style={[styles.actionText, post.upvotedByMe && { color: colors.accent, fontFamily: fonts.bold }]}>
            ▲ {post.upvotes} useful
          </Text>
        </Pressable>
        <Text style={styles.actionText}>{post.comments} replies</Text>
        <Text style={styles.actionText}>Share</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 12,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 15, color: '#141414' },
  author: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  authorMeta: { fontFamily: fonts.regular, color: colors.textTertiary, fontSize: 12.5 },
  kind: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  verifiedTag: {
    backgroundColor: colors.verifiedSoft,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { fontFamily: fonts.medium, fontSize: 11, color: colors.verified },
  body: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.text, marginTop: 11 },
  snap: { width: '100%', height: 190, borderRadius: 12, marginTop: 12, backgroundColor: colors.surface },
  actions: { flexDirection: 'row', gap: 22, marginTop: 13, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  action: {},
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
});
