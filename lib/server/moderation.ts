const PROFANITY_LIST = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "motherfucker"
];

export function containsProfanity(input: string) {
  const text = input.toLowerCase();
  return PROFANITY_LIST.some((word) => text.includes(word));
}

export function sanitizeToTags(input: string[]) {
  return input
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}
