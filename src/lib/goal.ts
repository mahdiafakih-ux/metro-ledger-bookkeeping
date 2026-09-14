export const MILESTONE_DOLLARS = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000];
export const MILESTONE_CENTS = MILESTONE_DOLLARS.map((d) => d * 100);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type PaceStatus = "ahead" | "on_track" | "behind" | "no_data";

export interface GoalStatsInput {
  goalAmountCents: number;
  goalDeadline: Date;
  goalStartDate: Date;
  earnedCents: number;
  now?: Date;
  avgAppointmentCents?: number; // used to estimate appointments needed
  businessPackageCents?: number; // used to estimate recurring clients needed
}

export interface GoalStats {
  goalAmountCents: number;
  earnedCents: number;
  remainingCents: number;
  percentComplete: number; // 0-100, clamped
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  monthsRemaining: number;
  weeksRemaining: number;
  dailyTargetCents: number;
  monthlyTargetCents: number;
  weeklyTargetCents: number;
  currentPaceCentsPerDay: number;
  requiredPaceCentsPerDay: number;
  paceStatus: PaceStatus;
  paceDeltaCentsPerDay: number; // positive = ahead, negative = behind
  projectedCompletionDate: Date | null;
  forecastedRevenueAtDeadlineCents: number;
  appointmentsNeeded: number;
  recurringClientsNeeded: number;
  nextMilestoneCents: number | null;
  achievedMilestonesCents: number[];
}

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / MS_PER_DAY;
}

export function computeGoalStats(input: GoalStatsInput): GoalStats {
  const now = input.now ?? new Date();
  const {
    goalAmountCents,
    goalDeadline,
    goalStartDate,
    earnedCents,
    avgAppointmentCents = 12500,
    businessPackageCents = 250000,
  } = input;

  const remainingCents = Math.max(goalAmountCents - earnedCents, 0);
  const percentComplete = goalAmountCents > 0
    ? Math.min(100, Math.max(0, (earnedCents / goalAmountCents) * 100))
    : 0;

  const totalDays = Math.max(daysBetween(goalStartDate, goalDeadline), 1);
  // Floored at a full day (not a fraction) so a goalStartDate of "just now" combined
  // with pre-existing revenue (demo data, backdated entries) can't produce a wild
  // divide-by-near-zero pace and an absurd extrapolated projection.
  const daysElapsed = Math.max(daysBetween(goalStartDate, now), 1);
  const daysRemaining = Math.max(daysBetween(now, goalDeadline), 0);

  const monthsRemaining = Math.max(daysRemaining / 30.44, 0.001);
  const weeksRemaining = Math.max(daysRemaining / 7, 0.001);

  const monthlyTargetCents = remainingCents > 0 ? remainingCents / monthsRemaining : 0;
  const weeklyTargetCents = remainingCents > 0 ? remainingCents / weeksRemaining : 0;
  const dailyTargetCents = remainingCents > 0 && daysRemaining > 0 ? remainingCents / daysRemaining : 0;

  const currentPaceCentsPerDay = earnedCents / daysElapsed;
  const requiredPaceCentsPerDay = daysRemaining > 0 ? remainingCents / daysRemaining : remainingCents > 0 ? Infinity : 0;

  let paceStatus: PaceStatus = "no_data";
  let paceDeltaCentsPerDay = 0;
  if (earnedCents > 0 || daysElapsed > 1) {
    paceDeltaCentsPerDay = currentPaceCentsPerDay - requiredPaceCentsPerDay;
    if (remainingCents <= 0) paceStatus = "ahead";
    else if (paceDeltaCentsPerDay > currentPaceCentsPerDay * 0.05) paceStatus = "ahead";
    else if (paceDeltaCentsPerDay < -currentPaceCentsPerDay * 0.05 - 1) paceStatus = "behind";
    else paceStatus = "on_track";
  }

  let projectedCompletionDate: Date | null = null;
  if (remainingCents <= 0) {
    projectedCompletionDate = now;
  } else if (currentPaceCentsPerDay > 0) {
    const daysToGoal = remainingCents / currentPaceCentsPerDay;
    projectedCompletionDate = new Date(now.getTime() + daysToGoal * MS_PER_DAY);
  }

  const forecastedRevenueAtDeadlineCents = Math.round(
    earnedCents + currentPaceCentsPerDay * daysRemaining
  );

  const appointmentsNeeded = avgAppointmentCents > 0 ? Math.ceil(remainingCents / avgAppointmentCents) : 0;
  const recurringClientsNeeded = businessPackageCents > 0
    ? Math.ceil(remainingCents / (businessPackageCents * Math.max(monthsRemaining, 1)))
    : 0;

  const achievedMilestonesCents = MILESTONE_CENTS.filter((m) => earnedCents >= m);
  const nextMilestoneCents = MILESTONE_CENTS.find((m) => earnedCents < m) ?? null;

  return {
    goalAmountCents,
    earnedCents,
    remainingCents,
    percentComplete,
    daysElapsed: Math.floor(daysElapsed),
    daysRemaining: Math.ceil(daysRemaining),
    totalDays: Math.floor(totalDays),
    monthsRemaining,
    weeksRemaining,
    dailyTargetCents,
    monthlyTargetCents,
    weeklyTargetCents,
    currentPaceCentsPerDay,
    requiredPaceCentsPerDay: Number.isFinite(requiredPaceCentsPerDay) ? requiredPaceCentsPerDay : 0,
    paceStatus,
    paceDeltaCentsPerDay,
    projectedCompletionDate,
    forecastedRevenueAtDeadlineCents,
    appointmentsNeeded,
    recurringClientsNeeded,
    nextMilestoneCents,
    achievedMilestonesCents,
  };
}
