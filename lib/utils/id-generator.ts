/**
 * Generates a unique ID for use in the application.
 * Tries to use crypto.randomUUID() if available, otherwise falls back to
 * a timestamp + random string based approach.
 */
export function generateId(): string {
  // Try to use crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: use timestamp + random string
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}
