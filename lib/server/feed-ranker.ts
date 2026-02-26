export function computeFeedScore(input: {
  createdAt: Date;
  likes: number;
  comments: number;
  saves: number;
}) {
  const ageHours = Math.max(1, (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60));
  const engagement = input.likes * 3 + input.comments * 2 + input.saves * 2;
  return engagement - ageHours * 0.25;
}
