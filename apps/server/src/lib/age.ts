export function ageOn(birthday: string | Date, today = new Date()) {
  const b = new Date(birthday);
  let age = today.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < b.getUTCMonth() ||
    (today.getUTCMonth() === b.getUTCMonth() && today.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

/** Minors (13–17) and adults only ever see their own group. */
export const ageBand = (age: number) => (age < 18 ? 'teen' : 'adult');
export const bandBounds = (age: number) => (age < 18 ? { min: 13, max: 17 } : { min: 18, max: 120 });
