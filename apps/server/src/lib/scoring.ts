/**
 * Relevance score for the discover queue. Carries over the spirit of the original Cliq algorithm
 * (likes-you boost, shared interests, similar age, same gig) and adds distance and recency.
 */
export type ScoreInput = {
  likedYou: boolean;
  sharedInterests: number;
  totalInterests: number;
  ageGap: number;
  miles: number;
  maxMiles: number;
  samePlace: boolean;
  sameTitle: boolean;
  daysSinceActive: number;
};

export function score(i: ScoreInput) {
  let s = 0;
  if (i.likedYou) s += 50;

  s += i.sharedInterests * 10;
  if (i.totalInterests > 0 && i.sharedInterests >= Math.min(3, i.totalInterests)) s += 15;

  if (i.ageGap === 0) s += 10;
  else if (i.ageGap <= 3) s += 5;
  else if (i.ageGap > 5) s -= i.ageGap;

  // Up to 15 points for being close, fading linearly to zero at the edge of the radius.
  s += 15 * Math.max(0, 1 - i.miles / Math.max(1, i.maxMiles));

  if (i.samePlace && i.sameTitle) s += 20;
  else if (i.samePlace || i.sameTitle) s += 5;

  // People who haven't opened the app in weeks sink, so the queue stays lively.
  s -= Math.min(20, Math.max(0, i.daysSinceActive - 3));
  return s;
}
