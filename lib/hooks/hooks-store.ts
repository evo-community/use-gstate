import * as React from "react";
import { flushSync } from "react-dom";
import { shallowEqualArrays } from "../shallow-equal";
import { Batcher, MicroTaskBatcher, TimerBatcher } from "../scheduler";
import {
  SubscriptionEventsStore,
  type SubscriptionCallback,
  type SubscriptionEventName,
  type RunAllCallbacksPayload,
} from "./subscription-events/store";

const applyAction = <T>(action: React.SetStateAction<T>, last: T) => {
  if (typeof action === "function") {
    const functionAction = action as (last: T) => T;
    return functionAction(last);
  } else {
    return action;
  }
};

type EffectType = "effect" | "layout-effect";

type Effect = {
  fn: () => (() => void) | undefined;
  deps: unknown[] | undefined;
};

type EffectState = {
  clearFunction: () => void;
  lastDeps: unknown[] | undefined;
  type: EffectType;
  effects: Effect[];
};

type StateList = Array<[any, React.Dispatch<React.SetStateAction<any>>]>;

export class HooksStore {
  private listeners = new Set<() => void>();
  private stateList: StateList = new Array(30);
  private effectList: EffectState[] = new Array(30);

  private stateIndex = -1;
  private effectIndex = -1;

  private effectsBatcher: Batcher = new TimerBatcher();
  private layoutEffectsBatcher: Batcher = new MicroTaskBatcher();

  private subscriptionEventsStore = new SubscriptionEventsStore();

  constructor() {}

  public nextState() {
    this.stateIndex++;
  }

  public nextEffect() {
    this.effectIndex++;
  }

  public nextSubscriptionEvent() {
    this.subscriptionEventsStore.next();
  }

  public resetCurrent() {
    this.stateIndex = -1;
    this.effectIndex = -1;
    this.subscriptionEventsStore.reset();
  }

  public getCurrentState<T = unknown>(
    initialState: T,
  ): [T, React.Dispatch<React.SetStateAction<T>>] {
    const currentIndex = this.stateIndex;
    let stateEntry = this.stateList[currentIndex];

    if (!stateEntry) {
      stateEntry = [
        applyAction(initialState, undefined),
        (action: React.SetStateAction<T>) => {
          const last = stateEntry[0];
          stateEntry[0] = applyAction(action, stateEntry[0]);
          // If the state has changed, notify the listeners
          if (last !== stateEntry[0]) {
            this.notifyListeners();
          }
        },
      ];

      this.stateList[currentIndex] = stateEntry;
    }

    return stateEntry;
  }

  public scheduleEffect(effect: Effect, type: EffectType) {
    let effectsState = this.effectList[this.effectIndex] as
      | EffectState
      | undefined;

    if (!effectsState) {
      effectsState = {
        type,
        lastDeps: undefined,
        effects: [effect],
        clearFunction: () => null,
      };
      this.effectList[this.effectIndex] = effectsState;
    } else {
      effectsState.effects.push(effect);
    }

    if (type === "layout-effect") {
      this.layoutEffectsBatcher.schedule(() => {
        flushSync(() => {
          this.runAllEffects("layout-effect");
        });
      });
    } else {
      this.effectsBatcher.schedule(() => {
        this.runAllEffects("effect");
      });
    }
  }

  private runAllEffects(type: EffectType) {
    this.effectList.forEach((effectState) => {
      if (effectState.type === type) {
        while (effectState.effects.length) {
          const effect = effectState.effects.shift()!;

          if (
            shallowEqualArrays(effectState.lastDeps, effect.deps) &&
            effect.deps
          ) {
            continue;
          }
          effectState.clearFunction();
          effectState.lastDeps = effect.deps;
          effectState.clearFunction = effect.fn() ?? (() => {});
        }
      }
    });
  }

  public scheduleSubscriptionEventCallback(
    callback: SubscriptionCallback | undefined,
    eventName: SubscriptionEventName,
  ) {
    this.subscriptionEventsStore.scheduleCallback(callback, eventName);
  }

  public runAllSubscriptionEventCallbacks(payload: RunAllCallbacksPayload) {
    this.subscriptionEventsStore.runAllCallbacks(payload);
  }

  public destroy() {
    this.runAllEffects("layout-effect");
    this.runAllEffects("effect");
    this.effectList.forEach((effectState) => {
      effectState.clearFunction();
    });
    this.stateList.length = 0;
    this.stateIndex = -1;
    this.effectList.length = 0;
    this.effectIndex = -1;
    this.subscriptionEventsStore.destroy();
  }

  public addListener(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }
}
