/** "Good Morning" / "Good Afternoon" / "Good Evening" like the reference header. */
export function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}
