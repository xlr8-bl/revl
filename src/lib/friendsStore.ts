/**
 * Friends — the social graph that makes notifications matter. Username
 * search over a mock department directory now; the server phase swaps the
 * directory for a real user search and adds contact matching (numbers
 * hashed on-device, never uploaded raw). Friends' activity is what feeds
 * the social rows in notifications and the Today room slice.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { pushNotification } from './notificationsStore';

const KEY = 'revl.friends.v1';

export type Person = {
  id: string;
  name: string;
  username: string;
  initial: string;
  color: string;
  /** Department line shown under the name in search results. */
  meta: string;
};

/**
 * Mock department directory — same people as the community mocks
 * (Brandon, Melissa, Grace, Tantoh keep their avatar colors from the
 * room feed) so names stay coherent across the app.
 */
export const DIRECTORY: Person[] = [
  { id: 'p1', name: 'Brandon Ngwa', username: 'brandon', initial: 'B', color: '#3C6FE8', meta: 'Computer Engineering · L400' },
  { id: 'p2', name: 'Melissa Enow', username: 'melissa', initial: 'M', color: '#9D2450', meta: 'Computer Engineering · L400' },
  { id: 'p3', name: 'Grace Fon', username: 'gracefon', initial: 'G', color: '#8A6D2F', meta: 'Computer Engineering · L400' },
  { id: 'p4', name: 'Tantoh Bere', username: 'tantoh', initial: 'T', color: '#357F84', meta: 'Computer Engineering · L300' },
  { id: 'p5', name: 'Ashley Mbah', username: 'ashleym', initial: 'A', color: '#B4543A', meta: 'Computer Engineering · L400' },
  { id: 'p6', name: 'Derick Che', username: 'derickc', initial: 'D', color: '#5C6E85', meta: 'Computer Engineering · L400' },
  { id: 'p7', name: 'Nadia Bih', username: 'nadiab', initial: 'N', color: '#7E5CA8', meta: 'Computer Engineering · L300' },
  { id: 'p8', name: 'Kelvin Ndip', username: 'kelvinn', initial: 'K', color: '#2E7D5B', meta: 'Computer Engineering · L400' },
  { id: 'p9', name: 'Sandra Ayuk', username: 'sandra', initial: 'S', color: '#C25A8A', meta: 'Computer Engineering · L200' },
  { id: 'p10', name: 'Blaise Tita', username: 'blaiset', initial: 'B', color: '#8C6239', meta: 'Computer Engineering · L500' },
  { id: 'p11', name: 'Vanessa Lum', username: 'vlum', initial: 'V', color: '#3A7CA5', meta: 'Computer Engineering · L400' },
  { id: 'p12', name: 'Emmanuel Fru', username: 'emafru', initial: 'E', color: '#A5533A', meta: 'Computer Engineering · L300' },
  { id: 'p13', name: 'Claris Ngum', username: 'claris', initial: 'C', color: '#5B8C2E', meta: 'Computer Engineering · L200' },
  { id: 'p14', name: 'Rodrigue Kam', username: 'rodkam', initial: 'R', color: '#84355F', meta: 'Computer Engineering · HND' },
  { id: 'p15', name: 'Faith Njie', username: 'faithn', initial: 'F', color: '#2F6B8A', meta: 'Computer Engineering · L400' },
];

type FriendsState = {
  /** Person ids you're friends with. */
  friends: string[];
  /** Incoming requests (they asked you). */
  incoming: string[];
  /** Outgoing requests (you asked them). */
  outgoing: string[];
};

let state: FriendsState = {
  // Seeded so the app doesn't open empty: Melissa and Grace are already
  // friends (their activity shows up), Brandon has asked to connect.
  friends: ['p2', 'p3'],
  incoming: ['p1'],
  outgoing: [],
};

const listeners = new Set<() => void>();
const emit = () => {
  state = { ...state };
  listeners.forEach((l) => l());
};
const persist = () => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      state = { ...state, ...JSON.parse(raw) };
      emit();
    }
  })
  .catch(() => {});

export function useFriends(): FriendsState {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state
  );
}

export function person(id: string): Person | undefined {
  return DIRECTORY.find((p) => p.id === id);
}

export function searchDirectory(query: string): Person[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DIRECTORY.filter(
    (p) => p.username.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  );
}

export function relationship(id: string): 'friend' | 'incoming' | 'outgoing' | 'none' {
  if (state.friends.includes(id)) return 'friend';
  if (state.incoming.includes(id)) return 'incoming';
  if (state.outgoing.includes(id)) return 'outgoing';
  return 'none';
}

export function sendRequest(id: string) {
  if (relationship(id) !== 'none') return;
  state.outgoing = [...state.outgoing, id];
  persist();
  emit();
}

export function acceptRequest(id: string) {
  if (!state.incoming.includes(id)) return;
  state.incoming = state.incoming.filter((x) => x !== id);
  state.friends = [...state.friends, id];
  persist();
  emit();
  const p = person(id);
  if (p) {
    pushNotification(
      {
        kind: 'friend',
        lead: p.name.split(' ')[0],
        body: 'is now your friend. Their study activity will show up here.',
        avatar: { initial: p.initial, color: p.color },
      },
      `friend:accepted:${id}`
    );
  }
}

export function declineRequest(id: string) {
  state.incoming = state.incoming.filter((x) => x !== id);
  persist();
  emit();
}

export function removeFriend(id: string) {
  state.friends = state.friends.filter((x) => x !== id);
  persist();
  emit();
}

/** Set of friend ids — for sorting friend activity first in feeds. */
export function friendIdSet(): Set<string> {
  return new Set(state.friends);
}
