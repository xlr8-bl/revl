/** "Good Morning" / "Good Afternoon" / "Good Evening" like the reference header. */
export function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export type Daypart = 'morning' | 'afternoon' | 'evening' | 'night';

/** Which part of the day it is — drives the Home screen's day/night mood. */
export function getDaypart(now: Date = new Date()): Daypart {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

/** Is it daytime (sun) vs night (moon)? */
export function isDaytime(now: Date = new Date()): boolean {
  const h = now.getHours();
  return h >= 6 && h < 18;
}

/** "today" while the sun's up, "tonight" once it's evening/night. */
export function planWord(now: Date = new Date()): string {
  return isDaytime(now) ? 'today' : 'tonight';
}
