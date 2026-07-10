/**
 * PostCard — one feed post in the Instagram layout students know:
 * avatar + bold name header, edge-to-edge media, a heart / reply /
 * share action row, and a bold count line.
 *
 * Interaction model (uniform on every post — no raise-hand, no ask/solve
 * split):
 *   · Double-tap anywhere on the post body / photo / question card
 *     → likes it, with the heart-burst animation.
 *   · Tap ♥ → toggle like.   · Tap 💬 → replies sheet.   · Tap ↗ → share.
 * The only tap inside the body that navigates is the question card's
 * explicit "Go to question" link.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { GestureResponderEvent, Image, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { likeOn, sharePost, toggleLike, type CommunityPost } from '../lib/communityStore';
import { colors, fonts, spacing, themedStyleSheet } from '../theme';
import { CommentsSheet } from './CommentsSheet';
import { QuestionAnchor } from './QuestionAnchor';
import { TapBurst } from './TapBurst';

export function PostCard({ post }: { post: CommunityPost }) {
  const meta = [post.author.level, post.courseCode, post.time].filter(Boolean).join(' · ');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [tapPos, setTapPos] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);

  // Manual double-tap detector (RN Pressable has no native double-tap). The
  // burst fires at the exact point the finger landed.
  const onContentTap = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      const now = Date.now();
      if (now - lastTap.current < 280) {
        lastTap.current = 0;
        setTapPos({ x: locationX, y: locationY });
        likeOn(post.id); // double-tap always likes, never unlikes
        setBurst((b) => b + 1);
      } else {
        lastTap.current = now;
      }
    },
    [post.id]
  );

  const share = async () => {
    sharePost(post.id);
    try {
      if (Platform.OS !== 'web') {
        await Share.share({ message: `${post.author.name} on Revl Class · ${post.courseCode ?? ''}\n\n${post.text}` });
      } else if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ text: post.text });
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <View style={styles.post}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.author.color }]}>
          <Text style={styles.avatarText}>{post.author.initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.author.name}</Text>
            {post.communityVerified && <Ionicons name="checkmark-circle" size={15} color={colors.verified} />}
          </View>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Double-tappable content: text + media + the question card. Only the
          nested "Go to question" link inside the card navigates. One burst
          overlay covers the whole region and pops at the exact tap point. */}
      <Pressable onPress={onContentTap}>
        <Text style={styles.body}>{post.text}</Text>

        {post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.media} resizeMode="cover" />}

        {post.questionRef && post.courseCode && (
          <View style={styles.anchorWrap}>
            <QuestionAnchor refr={post.questionRef} courseCode={post.courseCode} />
          </View>
        )}

        <TapBurst trigger={burst} x={tapPos.x} y={tapPos.y} color={post.imageUri ? '#FFFFFF' : colors.accent} />
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={() => toggleLike(post.id)} hitSlop={8}>
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={25}
            color={post.likedByMe ? colors.accent : colors.text}
          />
        </Pressable>
        <Pressable onPress={() => setCommentsOpen(true)} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={share} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Count line — teaches the gesture while there are no likes yet. */}
      {post.likes > 0 ? (
        <Text style={styles.countLine}>
          {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          {post.communityVerified ? ' · Class verified answer' : ''}
        </Text>
      ) : (
        <Text style={styles.hintLine}>Double-tap to like</Text>
      )}

      <View style={styles.subCounts}>
        {post.comments.length > 0 && (
          <Pressable onPress={() => setCommentsOpen(true)} hitSlop={6}>
            <Text style={styles.subCountLink}>View all {post.comments.length} replies</Text>
          </Pressable>
        )}
        {post.shares > 0 && <Text style={styles.subCount}>{post.shares} shares</Text>}
      </View>

      {commentsOpen && <CommentsSheet postId={post.id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} />}
    </View>
  );
}

const makeStyles = () => StyleSheet.create({
  post: {
    paddingTop: 16,
    paddingBottom: 18,
    // A recessed groove (the deep background) plus a hairline edge, so the
    // boundary between one post and the next is unmistakable in either theme.
    borderBottomWidth: 9,
    borderBottomColor: colors.bgDeep,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
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
  hintLine: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textTertiary,
    paddingHorizontal: spacing.gutter,
    marginTop: 9,
  },
  subCounts: { flexDirection: 'row', gap: 14, paddingHorizontal: spacing.gutter, marginTop: 5 },
  subCountLink: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  subCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary },
});
const styles = themedStyleSheet(makeStyles);
