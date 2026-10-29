export function formatRemaining(seconds: number): string {
  if (seconds >= 90) return `${Math.ceil(seconds / 60)} min`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
