/**
 * PostCard — one feed post, in the layout every student already knows
 * from Instagram/Twitter: full-width post with hairline separators (no
 * boxes), avatar + bold name header, edge-to-edge photo, heart/reply/
 * share action row, bold count line, "View all replies". Revl-specific
 * parts ride on top of the familiar frame: the verified check on solve
 * posts and the referenced exam question rendered like a quoted post.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { toggleUpvote, type CommunityPost } from '../lib/communityStore';
import { colors, fonts, spacing } from '../theme';
import { QuestionAnchor } from './QuestionAnchor';

export function PostCard({ post }: { post: CommunityPost }) {
  const meta = [post.author.level, post.courseCode, post.time].filter(Boolean).join(' · ');

  return (
    <View style={styles.post}>
      {/* Header: avatar · bold name (+ verified check) · meta · more */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.author.color }]}>
          <Text style={styles.avatarText}>{post.author.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.author.name}</Text>
            {post.communityVerified && (
              <Ionicons name="checkmark-circle" size={15} color={colors.verified} />
            )}
          </View>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.body}>{post.text}</Text>

      {/* Snapped work: edge-to-edge, like feed media */}
      {post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.media} resizeMode="cover" />}

      {/* The referenced exam question, framed like a quoted post */}
      {post.questionRef && post.courseCode && (
        <View style={styles.anchorWrap}>
          <QuestionAnchor refr={post.questionRef} courseCode={post.courseCode} />
        </View>
      )}

      {/* Action row: heart · reply · share */}
      <View style={styles.actions}>
        <Pressable onPress={() => toggleUpvote(post.id)} hitSlop={8}>
          <Ionicons
            name={post.upvotedByMe ? 'heart' : 'heart-outline'}
            size={25}
            color={post.upvotedByMe ? colors.accent : colors.text}
          />
        </Pressable>
        <Pressable hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
        </Pressable>
        <Pressable hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.countLine}>
        {post.upvotes} found this useful
        {post.communityVerified ? ' · Class verified answer' : ''}
      </Text>
      {post.comments > 0 && <Text style={styles.replies}>View all {post.comments} replies</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.gutter,
    marginBottom: 10,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 16, color: '#141414' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
  },
  media: { width: '100%', height: 280, marginTop: 12, backgroundColor: colors.surface },
  anchorWrap: { paddingHorizontal: spacing.gutter },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: spacing.gutter,
    marginTop: 12,
  },
  countLine: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
    marginTop: 9,
  },
  replies: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.gutter,
    marginTop: 5,
  },
});
