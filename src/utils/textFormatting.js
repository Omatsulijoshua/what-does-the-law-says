/**
 * Text formatting and sanitization utilities.
 */

export function cleanEmDashes(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\s*[—―]\s*/g, ', ')
    .replace(/\s*–\s*/g, ' - ');
}

export function stripHeadingHashes(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/^#{1,6}\s*/, '');
}
