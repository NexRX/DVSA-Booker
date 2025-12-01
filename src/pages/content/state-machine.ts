/**
 * Content Script State Machine / Router
 * Adds security backoff integration to reduce rapid reload loops on captcha
 * and banned (Error 15) states. The backoff logic tracks escalating delays
 * and throttles retries to appear more human and avoid detection.
 */

import { updatedState, type ManageState } from "@src/state";
import { navigateTo } from "@src/logic/navigation";
import { play } from "../background/exports";
import warnSound from "@assets/sounds/warn.mp3";
import successSound from "@assets/sounds/success.mp3";
import onLogin from "./on-login";
import onManage from "./on-manage";
import { fallbackSeconds } from "@src/state";

import { recordCaptcha, recordBanned, recommendedWaitBeforeRetry, shouldDeferCaptcha, shouldDeferBanned } from "@src/state/security";
import { secondsToHumanReadable } from "@src/logic/date";

type LazyUiExports = {
  waitUI: (waitSeconds?: number, randomize?: boolean) => Promise<void>;
  setMessage: (msg: string | undefined) => void;
};
type PageState = Awaited<ReturnType<typeof updatedState>>;
type StateMatch = PageState | RegExp | ((state: PageState) => boolean);
export interface StateMachineContext {
  current: PageState;
  previous: PageState | undefined;
  navigate: typeof navigateTo;
  alert: (sound: string, loop?: boolean) => void;
  setMessage: (msg: string | undefined) => void;
  waitUI: (waitSeconds?: number, randomize?: boolean) => Promise<void>;
  recheck: (afterSeconds?: number) => void;
  stop: () => void;
}

interface RegisteredHandler {
  match: StateMatch;
  handler: (ctx: StateMachineContext) => Promise<void> | void;
  description?: string;
  priority: number;
}

interface AlertConfig {
  sound: string;
  loop?: boolean;
}

export class ContentStateMachine {
  private handlers: RegisteredHandler[] = [];
  private previousState: PageState | undefined;
  private inFlight = false;
  private pendingRecheck: boolean | number = false;
  private ui: LazyUiExports | null = null;
  private alertConfig: Array<{ match: StateMatch; config: AlertConfig }> = [];
  private fallbackHandler: ((ctx: StateMachineContext) => Promise<void> | void) | null = null;

  on(match: StateMatch, handler: RegisteredHandler["handler"], opts?: { description?: string; priority?: number }) {
    this.handlers.push({
      match,
      handler,
      description: opts?.description,
      priority: opts?.priority ?? 0,
    });
    this.handlers.sort((a, b) => b.priority - a.priority);
    return this;
  }

  onMany(states: PageState[], handler: RegisteredHandler["handler"], opts?: { description?: string; priority?: number }) {
    states.forEach((s) => this.on(s, handler, opts));
    return this;
  }

  alertOn(match: StateMatch, sound: string, loop: boolean = false) {
    this.alertConfig.push({ match, config: { sound, loop } });
    return this;
  }

  onFallback(handler: (ctx: StateMachineContext) => Promise<void> | void) {
    this.fallbackHandler = handler;
    return this;
  }

  public injectUi(ui: LazyUiExports) {
    this.ui = ui;
  }

  private getUi(): LazyUiExports {
    if (!this.ui) {
      throw new Error("UI exports not injected. Call contentMachine.injectUi({ waitUI, setMessage }) before route().");
    }
    return this.ui;
  }

  private matches(rule: StateMatch, state: PageState): boolean {
    if (typeof rule === "string") return rule === state;
    if (rule instanceof RegExp) return rule.test(state);
    if (typeof rule === "function") return rule(state);
    return false;
  }

  private maybeAlert(state: PageState) {
    for (const { match, config } of this.alertConfig) {
      if (this.matches(match, state)) {
        play(config.sound, !!config.loop);
      }
    }
  }

  async route(): Promise<void> {
    if (this.inFlight) {
      this.pendingRecheck = true;
      return;
    }
    this.inFlight = true;

    try {
      const current = await updatedState();
      this.maybeAlert(current);
      const ui = this.getUi();
      const ctx: StateMachineContext = {
        current,
        previous: this.previousState,
        navigate: navigateTo,
        alert: (sound, loop) => play(sound, loop),
        setMessage: ui.setMessage,
        waitUI: ui.waitUI,
        recheck: (delaySeconds?: number) => {
          this.pendingRecheck = delaySeconds ?? true;
        },
        stop: () => {
          this.pendingRecheck = false;
        },
      };

      const handler = this.handlers.find((h) => this.matches(h.match, current));

      if (handler) {
        console.debug("[ContentStateMachine] Handling state:", current, handler.description ?? "");
        await handler.handler(ctx);
      } else {
        console.warn("[ContentStateMachine] No handler matched state:", current);
        if (this.fallbackHandler) {
          await this.fallbackHandler(ctx);
        } else {
          ui.setMessage(`Unhandled state: ${current}. Returning to login shortly.`);
          await ui.waitUI(60, false);
          navigateTo("login");
        }
      }

      this.previousState = current;
    } catch (err) {
      console.error("[ContentStateMachine] Routing error:", err);

      try {
        const ui = this.getUi();
        ui.setMessage("Error occurred, restarting soon if no progression");
        await ui.waitUI(30, false);
        navigateTo("login");
      } catch {
        navigateTo("login");
      }
    } finally {
      this.inFlight = false;

      if (this.pendingRecheck) {
        try {
          const seconds = typeof this.pendingRecheck === "number" ? this.pendingRecheck : 0;
          const ui = this.getUi();
          ui.setMessage(`Restarting in ${seconds} seconds if no progression`);
          await ui.waitUI(seconds);
        } catch {
          /* ignore */
        }

        this.pendingRecheck = false;
        Promise.resolve().then(() => this.route());
      }
    }
  }
}

/* -------------------------------------------------------------------------- */

/* Default instance & registrations                                           */

/* -------------------------------------------------------------------------- */

export const contentMachine = new ContentStateMachine()
  // Audio alerts
  .alertOn("captcha", warnSound, true)
  .alertOn("banned", warnSound, true)
  .alertOn(/^manage-confirm-changes-final$/, successSound, true)
  // Handlers
  .on(
    "login",
    async (ctx) => {
      ctx.setMessage("Attempting auto login");
      await onLogin();
      ctx.recheck(60);
    },
    { description: "Login handler", priority: 10 }
  )
  .on(
    /^manage-/,
    async (ctx) => {
      await onManage(ctx.current as ManageState);
    },
    { description: "Manage handler", priority: 5 }
  )
  // Captcha handler with backoff
  .on(
    "captcha",
    async (ctx) => {
      await recordCaptcha();
      const defer = await shouldDeferCaptcha();
      const waitSeconds = await recommendedWaitBeforeRetry("captcha");
      if (defer && waitSeconds > 0) {
        const duration = secondsToHumanReadable(waitSeconds);
        ctx.setMessage(`Captcha encountered. Backing off for ${duration} (${waitSeconds}s) before retry.`);
        await ctx.waitUI(waitSeconds, false);
      } else {
        ctx.setMessage("Captcha encountered. Short wait before retry.");
        await ctx.waitUI(Math.max(waitSeconds, 60), false);
      }
      ctx.navigate("login");
    },
    { description: "Captcha backoff", priority: 9 }
  )
  // Banned handler with backoff
  .on(
    "banned",
    async (ctx) => {
      await recordBanned();
      const defer = await shouldDeferBanned();
      const waitSeconds = await recommendedWaitBeforeRetry("banned");
      if (defer && waitSeconds > 0) {
        const duration = secondsToHumanReadable(waitSeconds);
        ctx.setMessage(`Banned / Error 15 detected. Cooling down for ${duration} (${waitSeconds}s).`);
        await ctx.waitUI(waitSeconds, false);
      } else {
        const fallback = Math.max(waitSeconds, 300);
        ctx.setMessage(`Banned detected. Waiting ${fallback}s before retry.`);
        await ctx.waitUI(fallback, false);
      }
      ctx.navigate("login");
    },
    { description: "Banned backoff", priority: 9 }
  )
  .on(
    "search-limit",
    async (ctx) => {
      ctx.setMessage("Search limit reached, applying 5m cool-down");
      await ctx.waitUI(300, false);
      ctx.navigate("login");
    },
    { description: "Search limit backoff" }
  )
  // Fallback
  .onFallback(async (ctx) => {
    ctx.setMessage(`Unknown state (${ctx.current}). Restarting soon if no progression.`);
    await ctx.waitUI(await fallbackSeconds(), false);
    ctx.navigate("login");
  });

export async function routeContentState() {
  await contentMachine.route();
}
