const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Returns the first emoji (as a whole grapheme, so ❤️ or 👨‍👩‍👧 stay intact) found in the input, or ''. */
export function firstEmoji(input: unknown): string {
  if (typeof input !== 'string') return '';
  const s = input.trim().slice(0, 64);
  if (!s) return '';

  let pieces: string[];
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
    pieces = Array.from(seg.segment(s) as Iterable<{ segment: string }>, x => x.segment);
  } else {
    pieces = Array.from(s);
  }

  const hit = pieces.find(p => EMOJI_RE.test(p));
  return hit && hit.length <= 16 ? hit : '';
}
