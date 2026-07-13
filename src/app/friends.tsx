/**
 * Friends — people you actually know, so notifications and the class feed
 * are about YOUR people, not strangers. Username search over the
 * department directory (server search later), incoming requests with
 * accept/decline, the friends list, and a contact-matching card that is
 * designed but visibly stubbed (numbers are hashed on-device in that
 * flow — never uploaded raw).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  acceptRequest,
  declineRequest,
  person,
  removeFriend,
  searchDirectory,
  sendRequest,
  useFriends,
  type Person,
} from '../lib/friendsStore';
import { colors, fonts, spacing, themedStyleSheet, useThemeVersion, withAlpha } from '../theme';

export default function FriendsScreen() {
  useThemeVersion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { friends, incoming, outgoing } = useFriends();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchDirectory(query), [query, friends, incoming, outgoing]);
  const friendPeople = friends.map(person).filter(Boolean) as Person[];
  const incomingPeople = incoming.map(person).filter(Boolean) as Person[];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 60 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.kicker}>People you actually know</Text>
          <Text style={styles.title}>Friends</Text>
        </View>

        {/* Username search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by username or name"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {query.trim().length > 0 && (
          <View style={styles.list}>
            {results.length === 0 && (
              <Text style={styles.noResults}>No one matches "{query.trim()}" yet.</Text>
            )}
            {results.map((p, i) => (
              <PersonRow key={p.id} p={p} first={i === 0}>
                <SearchAction p={p} friends={friends} incoming={incoming} outgoing={outgoing} />
              </PersonRow>
            ))}
          </View>
        )}

        {/* Incoming requests */}
        {incomingPeople.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Requests</Text>
            <View style={styles.list}>
              {incomingPeople.map((p, i) => (
                <PersonRow key={p.id} p={p} first={i === 0}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => acceptRequest(p.id)} style={styles.acceptBtn}>
                      <Text style={styles.acceptText}>Accept</Text>
                    </Pressable>
                    <Pressable onPress={() => declineRequest(p.id)} style={styles.quietBtn}>
                      <Text style={styles.quietText}>Decline</Text>
                    </Pressable>
                  </View>
                </PersonRow>
              ))}
            </View>
          </>
        )}

        {/* Friends list */}
        <Text style={styles.sectionLabel}>
          {friendPeople.length > 0 ? `Your friends · ${friendPeople.length}` : 'Your friends'}
        </Text>
        {friendPeople.length === 0 ? (
          <Text style={styles.noResults}>
            No friends yet — search a username above to send your first request.
          </Text>
        ) : (
          <View style={styles.list}>
            {friendPeople.map((p, i) => (
              <PersonRow key={p.id} p={p} first={i === 0}>
                <Pressable onPress={() => removeFriend(p.id)} hitSlop={8} style={styles.quietBtn}>
                  <Text style={styles.quietText}>Remove</Text>
                </Pressable>
              </PersonRow>
            ))}
          </View>
        )}

        {/* Privacy contract — revision effort is nobody's business */}
        <View style={styles.privacyCard}>
          <View style={styles.contactsHead}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.contactsTitle}>What friends can see</Text>
          </View>
          <Text style={styles.contactsBody}>
            Only what you choose to publish: papers you upload, answers you verify, and posts you
            make in the room. Friends never see your study activity — no sessions, streaks, reveal
            counts or "last studied" — so nobody can measure how hard you are (or aren't)
            revising.
          </Text>
        </View>

        {/* Contact matching — designed, visibly stubbed */}
        <View style={styles.contactsCard}>
          <View style={styles.contactsHead}>
            <Ionicons name="people-circle-outline" size={22} color={colors.accent} />
            <Text style={styles.contactsTitle}>Find friends from contacts</Text>
            <View style={styles.soonPill}>
              <Text style={styles.soonText}>Coming soon</Text>
            </View>
          </View>
          <Text style={styles.contactsBody}>
            Match people already on Revl from your phone book. Numbers are hashed on your phone
            before matching — they are never uploaded raw, and we never message anyone for you.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SearchAction({
  p,
  friends,
  incoming,
  outgoing,
}: {
  p: Person;
  friends: string[];
  incoming: string[];
  outgoing: string[];
}) {
  if (friends.includes(p.id))
    return (
      <View style={styles.stateTag}>
        <Ionicons name="checkmark" size={13} color={colors.textSecondary} />
        <Text style={styles.stateText}>Friends</Text>
      </View>
    );
  if (outgoing.includes(p.id))
    return (
      <View style={styles.stateTag}>
        <Text style={styles.stateText}>Requested</Text>
      </View>
    );
  if (incoming.includes(p.id))
    return (
      <Pressable onPress={() => acceptRequest(p.id)} style={styles.acceptBtn}>
        <Text style={styles.acceptText}>Accept</Text>
      </Pressable>
    );
  return (
    <Pressable onPress={() => sendRequest(p.id)} style={styles.addBtn}>
      <Text style={styles.addText}>Add</Text>
    </Pressable>
  );
}

function PersonRow({ p, first, children }: { p: Person; first: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.personRow, !first && styles.personDivider]}>
      <View style={[styles.avatar, { backgroundColor: p.color }]}>
        <Text style={styles.avatarInitial}>{p.initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{p.name}</Text>
        <Text style={styles.personMeta}>
          @{p.username} · {p.meta}
        </Text>
      </View>
      {children}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.gutter, marginBottom: 4 },
    circleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kicker: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 16 },
    title: { fontFamily: fonts.bold, fontSize: 38, color: colors.text, marginTop: 2 },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginHorizontal: spacing.gutter,
      marginTop: 16,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      backgroundColor: colors.card,
      paddingHorizontal: 13,
      height: 46,
    },
    searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
    sectionLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textTertiary,
      paddingHorizontal: spacing.gutter,
      marginTop: 26,
      marginBottom: 4,
    },
    list: { marginTop: 4 },
    noResults: {
      fontFamily: fonts.regular,
      fontSize: 13.5,
      color: colors.textSecondary,
      paddingHorizontal: spacing.gutter,
      marginTop: 14,
    },
    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.gutter,
      paddingVertical: 12,
    },
    personDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontFamily: fonts.bold, fontSize: 16, color: '#FFF' },
    personName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
    personMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },
    addBtn: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    addText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onAccent },
    acceptBtn: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 15,
      paddingVertical: 8,
    },
    acceptText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onAccent },
    quietBtn: {
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.card,
    },
    quietText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.textSecondary },
    stateTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
    stateText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
    privacyCard: {
      marginHorizontal: spacing.gutter,
      marginTop: 30,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
    },
    contactsCard: {
      marginHorizontal: spacing.gutter,
      marginTop: 14,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: withAlpha(colors.accent, 0.35),
      backgroundColor: withAlpha(colors.accent, 0.06),
      padding: 16,
    },
    contactsHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactsTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
    soonPill: {
      borderRadius: 999,
      backgroundColor: withAlpha(colors.accent, 0.16),
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    soonText: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.accent },
    contactsBody: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
      marginTop: 10,
    },
  });
const styles = themedStyleSheet(makeStyles);
