/**
 * Security / Anti-Detection Backoff State
 *
 * Purpose:
 *  Tracks occurrences of captcha challenges and "banned" (Error 15 / Incapsula)
 *  responses and applies an exponential backoff strategy to reduce aggressive
 *  reload loops that can flag automated behavior.
 *
 * Storage Schema:
 *  - Separate counters & levels for captcha and banned.
 *  - Each event escalates a backoff level (capped) and schedules a next retry timestamp.
 *  - Manual pause capability (e.g. user triggered) via manualPauseUntil.
 *
 * Backoff Strategy (Exponential with Caps):
 *  nextDelaySeconds = baseSeconds * 2^level (capped at maxSeconds)
 *
 * Captcha:
 *   Base: 120s (2 min)
 *   Max: 3600s (60 min)
 *
 * Banned:
 *   Base: 600s (10 min)
 *   Max: 21600s (6 hours)
 *
 * Example Usage:
 *   import { recordCaptcha, shouldDeferCaptcha, getSecurity } from "./security";
 *
 *   if (shouldDeferCaptcha()) {
 *     // show UI wait based on recommendedWaitBeforeRetry("captcha")
 *   } else {
 *     // attempt navigation / interaction again
 *   }
 *
 * All exported helpers are pure wrappers around the stored state.
 */

import { StorageItem } from "webext-storage";
import { storage } from "./storage";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const SECURITY_KEY = "security";

const BASE_CAPTCHA_SECONDS = 600; // 10 minutes
const MAX_CAPTCHA_SECONDS = 3600; // 60 minutes

const BASE_BANNED_SECONDS = 1800; // 30 minutes
const MAX_BANNED_SECONDS = 21600; // 6 hours

// Hard cap on exponential level (prevents overflow & overly huge waits)
const MAX_BACKOFF_LEVEL = 6;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TSecurity = {
  version: 0;

  // Counters
  captchaCount: number;
  bannedCount: number;

  // Last timestamps (epoch ms)
  lastCaptchaAt?: number;
  lastBannedAt?: number;

  // Exponential backoff progression levels
  backoffLevelCaptcha: number;
  backoffLevelBanned: number;

  // Computed next retry timestamps (epoch ms)
  nextRetryCaptcha?: number;
  nextRetryBanned?: number;

  // Last detected type (for diagnostics / UI)
  lastType?: "captcha" | "banned";

  // Manual pause until timestamp (epoch ms) - overrides other timings
  manualPauseUntil?: number;
};

const initialSecurityV0: TSecurity = {
  version: 0,
  captchaCount: 0,
  bannedCount: 0,
  lastCaptchaAt: undefined,
  lastBannedAt: undefined,
  backoffLevelCaptcha: 0,
  backoffLevelBanned: 0,
  nextRetryCaptcha: undefined,
  nextRetryBanned: undefined,
  lastType: undefined,
  manualPauseUntil: undefined,
};

export const initialSecurity = initialSecurityV0;

/* -------------------------------------------------------------------------- */
/* Storage Item                                                               */
/* -------------------------------------------------------------------------- */

export const security = new StorageItem<TSecurity>(SECURITY_KEY, {
  defaultValue: initialSecurity,
  area: storage,
});

/* -------------------------------------------------------------------------- */
/* Internal Helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Compute the next retry epoch given base, level, and cap.
 */
function computeNextRetry(baseSeconds: number, level: number, maxSeconds: number): number {
  // Ensure level bounded
  const safeLevel = Math.min(level, MAX_BACKOFF_LEVEL);
  // Exponential growth
  const raw = baseSeconds * Math.pow(2, safeLevel);
  const boundedSeconds = Math.min(raw, maxSeconds);
  return Date.now() + boundedSeconds * 1000;
}

/**
 * Derive current recommended retry WAIT SECONDS for a given security type using stored state.
 * Returns 0 if no backoff is scheduled or time has already elapsed.
 */
function deriveRemainingSeconds(nextTimestamp?: number): number {
  if (!nextTimestamp) return 0;
  const delta = nextTimestamp - Date.now();
  return delta <= 0 ? 0 : Math.ceil(delta / 1000);
}

/* -------------------------------------------------------------------------- */
/* Public API: Read                                                           */
/* -------------------------------------------------------------------------- */

export async function getSecurity(): Promise<TSecurity> {
  return await security.get();
}

/**
 * Returns true if a manual pause is active.
 */
export async function isManuallyPaused(): Promise<boolean> {
  const s = await getSecurity();
  return !!s.manualPauseUntil && s.manualPauseUntil > Date.now();
}

/**
 * Remaining seconds (rounded up) before captcha retry is allowed.
 */
export async function remainingCaptchaSeconds(): Promise<number> {
  const s = await getSecurity();
  return deriveRemainingSeconds(s.nextRetryCaptcha);
}

/**
 * Remaining seconds (rounded up) before banned retry is allowed.
 */
export async function remainingBannedSeconds(): Promise<number> {
  const s = await getSecurity();
  return deriveRemainingSeconds(s.nextRetryBanned);
}

/**
 * True if we should defer actions due to captcha backoff.
 */
export async function shouldDeferCaptcha(): Promise<boolean> {
  if (await isManuallyPaused()) return true;
  return (await remainingCaptchaSeconds()) > 0;
}

/**
 * True if we should defer actions due to banned backoff.
 */
export async function shouldDeferBanned(): Promise<boolean> {
  if (await isManuallyPaused()) return true;
  return (await remainingBannedSeconds()) > 0;
}

/**
 * Consolidated: Returns the minimum seconds we should wait (captcha vs banned vs manual).
 * Returns 0 if clear to proceed.
 */
export async function recommendedWaitBeforeRetry(type?: "captcha" | "banned"): Promise<number> {
  const s = await getSecurity();

  const manual = s.manualPauseUntil ? deriveRemainingSeconds(s.manualPauseUntil) : 0;
  const captcha = deriveRemainingSeconds(s.nextRetryCaptcha);
  const banned = deriveRemainingSeconds(s.nextRetryBanned);

  if (type === "captcha") {
    return Math.max(manual, captcha);
  } else if (type === "banned") {
    return Math.max(manual, banned);
  }
  return Math.max(manual, captcha, banned);
}

/* -------------------------------------------------------------------------- */
/* Public API: Mutations - Recording Events                                   */
/* -------------------------------------------------------------------------- */

/**
 * Record a captcha event & escalate backoff.
 */
export async function recordCaptcha(): Promise<TSecurity> {
  const s = await getSecurity();
  const newLevel = Math.min(s.backoffLevelCaptcha + 1, MAX_BACKOFF_LEVEL);
  const nextRetry = computeNextRetry(BASE_CAPTCHA_SECONDS, newLevel, MAX_CAPTCHA_SECONDS);
  const updated: TSecurity = {
    ...s,
    captchaCount: s.captchaCount + 1,
    lastCaptchaAt: Date.now(),
    backoffLevelCaptcha: newLevel,
    nextRetryCaptcha: nextRetry,
    lastType: "captcha",
  };
  await security.set(updated);
  return updated;
}

/**
 * Record a banned (Error 15 / Incapsula) event & escalate backoff.
 */
export async function recordBanned(): Promise<TSecurity> {
  const s = await getSecurity();
  const newLevel = Math.min(s.backoffLevelBanned + 1, MAX_BACKOFF_LEVEL);
  const nextRetry = computeNextRetry(BASE_BANNED_SECONDS, newLevel, MAX_BANNED_SECONDS);
  const updated: TSecurity = {
    ...s,
    bannedCount: s.bannedCount + 1,
    lastBannedAt: Date.now(),
    backoffLevelBanned: newLevel,
    nextRetryBanned: nextRetry,
    lastType: "banned",
  };
  await security.set(updated);
  return updated;
}

/* -------------------------------------------------------------------------- */
/* Public API: Mutations - Resets & Manual Control                            */
/* -------------------------------------------------------------------------- */

/**
 * Reset captcha backoff (e.g. after successful human verification).
 */
export async function resetCaptchaBackoff(): Promise<TSecurity> {
  const s = await getSecurity();
  const updated: TSecurity = {
    ...s,
    backoffLevelCaptcha: 0,
    nextRetryCaptcha: undefined,
    lastType: s.lastType === "captcha" ? undefined : s.lastType,
  };
  await security.set(updated);
  return updated;
}

/**
 * Reset banned backoff (e.g. after page becomes accessible again).
 */
export async function resetBannedBackoff(): Promise<TSecurity> {
  const s = await getSecurity();
  const updated: TSecurity = {
    ...s,
    backoffLevelBanned: 0,
    nextRetryBanned: undefined,
    lastType: s.lastType === "banned" ? undefined : s.lastType,
  };
  await security.set(updated);
  return updated;
}

/**
 * Set a manual pause duration (seconds from now).
 * Passing 0 clears the manual pause.
 */
export async function setManualPause(seconds: number): Promise<TSecurity> {
  const s = await getSecurity();
  const manualPauseUntil = seconds > 0 ? Date.now() + seconds * 1000 : undefined;
  const updated: TSecurity = {
    ...s,
    manualPauseUntil,
  };
  await security.set(updated);
  return updated;
}

/**
 * Clear manual pause immediately.
 */
export async function clearManualPause(): Promise<TSecurity> {
  return setManualPause(0);
}

/**
 * Reset all security/backoff state to initial values.
 */
export async function resetAllSecurity(): Promise<TSecurity> {
  await security.set({ ...initialSecurity });
  return await getSecurity();
}

/* -------------------------------------------------------------------------- */
/* Diagnostics Helpers                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns a user-facing summary string (for debugging / overlay use).
 */
export async function securitySummary(): Promise<string> {
  const s = await getSecurity();
  const parts: string[] = [];
  if (s.manualPauseUntil && s.manualPauseUntil > Date.now()) {
    parts.push(`Manual pause: ${deriveRemainingSeconds(s.manualPauseUntil)}s`);
  }
  if (s.nextRetryCaptcha && deriveRemainingSeconds(s.nextRetryCaptcha) > 0) {
    parts.push(`Captcha backoff: ${deriveRemainingSeconds(s.nextRetryCaptcha)}s (lvl ${s.backoffLevelCaptcha})`);
  }
  if (s.nextRetryBanned && deriveRemainingSeconds(s.nextRetryBanned) > 0) {
    parts.push(`Banned backoff: ${deriveRemainingSeconds(s.nextRetryBanned)}s (lvl ${s.backoffLevelBanned})`);
  }
  if (parts.length === 0) parts.push("No active backoff");
  return parts.join(" | ");
}

/* -------------------------------------------------------------------------- */
/* End                                                                        */
/* -------------------------------------------------------------------------- */
