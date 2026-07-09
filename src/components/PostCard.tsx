/**
 * PostCard — one feed post in the layout students already know from
 * Instagram: avatar + bold name header, edge-to-edge media, a
 * heart / reply / share action row, and a bold count line.
 *
 * Interaction model:
 *   · Double-tap the post  → likes it, with the heart-burst animation.
 *   · Tap ♥                → toggle like. On an ASK the like is your
 *                            raised hand (demand); on a SOLVE it is a
 *                            "found this useful" vote.
 *   · Tap 💬               → opens the replies sheet (real comments).
 *   · Tap ↗                → OS share sheet, and the share is counted.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { likeOn, sharePost, toggleLike, type CommunityPost } from '../lib/communityStore';
import { colors, fonts, spacing } from '../theme';
import { CommentsSheet } from './CommentsSheet';
import { QuestionAnchor } from './QuestionAnchor';
import { TapBurst } from './TapBurst';

export function PostCard({ post }: { post: CommunityPost }) {
  const meta = [post.author.level, post.courseCode, post.time].filter(Boolean).join(' · ');
  const isAsk = post.kind === 'ask';
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  // Manual double-tap detector (RN has no native double-tap on Pressable).
  const onBodyTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      likeOn(post.id); // double-tap always likes, never unlikes
      setBurst((b) => b + 1);
    } else {
      lastTap.current = now;
    }
  }, [post.id]);

  const share = async () => {
    sharePost(post.id);
    try {
      if (Platform.OS !== 'web') {
        await Share.share({
          message: `${post.author.name} on Revl Class · ${post.courseCode ?? ''}\n\n${post.text}`,
        });
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const countLabel = isAsk
    ? `${post.likes} ${post.likes === 1 ? 'classmate wants' : 'classmates want'} this solved`
    : `${post.likes} found this useful${post.communityVerified ? ' · Class verified answer' : ''}`;

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

      {/* Double-tappable content region (text + media). The heart bursts here. */}
      <Pressable onPress={onBodyTap}>
        <Text style={styles.body}>{post.text}</Text>
        {post.imageUri && (
          <View>
            <Image source={{ uri: post.imageUri }} style={styles.media} resizeMode="cover" />
            <TapBurst trigger={burst}>
              <Ionicons name="heart" size={92} color="#FFFFFF" />
            </TapBurst>
          </View>
        )}
        {!post.imageUri && (
          <TapBurst trigger={burst}>
            <Ionicons name="heart" size={72} color={colors.accent} />
          </TapBurst>
        )}
      </Pressable>

      {/* The referenced exam question, framed like the reader's card */}
      {post.questionRef && post.courseCode && (
        <View style={styles.anchorWrap}>
          <QuestionAnchor refr={post.questionRef} courseCode={post.courseCode} postKind={post.kind} />
        </View>
      )}

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

      <Text style={styles.countLine}>{countLabel}</Text>
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

const styles = StyleSheet.create({
  post: {
    paddingTop: 14,
    paddingBottom: 18,
    // A solid band, not a hairline: posts end unmistakably.
    borderBottomWidth: 7,
    borderBottomColor: colors.card,
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
  subCounts: { flexDirection: 'row', gap: 14, paddingHorizontal: spacing.gutter, marginTop: 5 },
  subCountLink: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  subCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary },
});
