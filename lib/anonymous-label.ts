export function getAnonymousLabel(userId: string, scopeId: string) {
  const seed = `${userId}:${scopeId}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = letters[hash % letters.length];
  const suffix = String(hash % 1000).padStart(3, '0');

  return `Anon ${prefix}${suffix}`;
}
