export interface ScorecardTargets {
  targetBusinessesContacted: number;
  targetCalls: number;
  targetEmails: number;
  targetFollowUps: number;
}

export interface ScorecardEntryLike {
  businessesContacted: number;
  calls: number;
  emails: number;
  followUps: number;
  socialPostDone: boolean;
}

export function computeDailyScore(entry: ScorecardEntryLike, targets: ScorecardTargets): number {
  const ratios = [
    targets.targetBusinessesContacted > 0 ? Math.min(1, entry.businessesContacted / targets.targetBusinessesContacted) : 1,
    targets.targetCalls > 0 ? Math.min(1, entry.calls / targets.targetCalls) : 1,
    targets.targetEmails > 0 ? Math.min(1, entry.emails / targets.targetEmails) : 1,
    targets.targetFollowUps > 0 ? Math.min(1, entry.followUps / targets.targetFollowUps) : 1,
    entry.socialPostDone ? 1 : 0,
  ];
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return Math.round(avg * 100);
}

const STREAK_THRESHOLD = 80;

export function computeStreak(scores: { date: Date; score: number }[]): number {
  // scores must be sorted descending by date, one entry per day (today first)
  let streak = 0;
  for (const s of scores) {
    if (s.score >= STREAK_THRESHOLD) streak++;
    else break;
  }
  return streak;
}
