/* eslint-disable react-hooks/rules-of-hooks */
import * as React from "react";
import { runInHooksContext } from "./hooks";
import { HooksStore } from "./hooks/hooks-store";
import { shallowEqual } from "./shallow-equal";
import { MicroTaskBatcher } from "./scheduler";

export type GStoreOptions = {
  onSubscribed?: (subscribers: number) => void;
  onUnsubscribed?: (subscribers: number) => void;
  onFirstSubscribed?: () => void;
  onAllUnsubscribed?: () => void;
  initialize?: "lazy" | "eager";
  destroy?: "no" | "on-all-unsubscribed";
};

export type Listener = () => void;

export class GStore<T> {
  private hooksStore = new HooksStore();

  private microTaskBatcher = new MicroTaskBatcher();

  private isFresh = false;
  private valueCache: T | undefined = undefined;
  private listeners = new Set<Listener>();

  constructor(
    private stateFactory: () => T,
    private options: GStoreOptions = {},
  ) {
    this.options.destroy ??= "no";
    this.options.initialize ??= "lazy";
    this.subscribeToHooksStore();

    if (this.options.initialize === "eager") {
      this.initialize();
    }
  }

  initialize() {
    this.getState();
  }

  destroy() {
    this.valueCache = undefined;
    this.isFresh = false;
    this.hooksStore.destroy();
  }

  getState() {
    if (this.isFresh) {
      return this.valueCache!;
    } else {
      const result = runInHooksContext(
        () => this.stateFactory(),
        this.hooksStore,
      );

      this.isFresh = true;
      this.valueCache = result;

      return this.valueCache!;
    }
  }

  subscribe = (callback: Listener) => {
    this.listeners.add(callback);
    this.options?.onSubscribed?.(this.listeners.size);
    this.hooksStore.runAllSubscriptionEventCallbacks({
      name: "subscribed",
      listenersCount: this.listeners.size,
    });

    if (this.listeners.size === 1) {
      this.options?.onFirstSubscribed?.();
      this.hooksStore.runAllSubscriptionEventCallbacks({
        name: "first-subscribed",
      });
    }

    return () => {
      const isRemoved = this.listeners.delete(callback);

      if (!isRemoved) {
        return;
      }

      this.options?.onUnsubscribed?.(this.listeners.size);
      this.hooksStore.runAllSubscriptionEventCallbacks({
        name: "unsubscribed",
        listenersCount: this.listeners.size,
      });

      if (this.listeners.size === 0) {
        this.options?.onAllUnsubscribed?.();
        this.hooksStore.runAllSubscriptionEventCallbacks({
          name: "all-unsubscribed",
        });

        if (this.options.destroy === "on-all-unsubscribed") {
          this.destroy();
        }
      }
    };
  };

  useReact = <Res = T>(
    selector = (state: T) => state as unknown as Res,
    compareMode: "shallow" | "strict" = "strict",
  ) => {
    const lastValue = React.useRef<Res | undefined>(undefined);

    const selectorWithMode = (state: T) => {
      if (compareMode === "shallow") {
        const next = selector(state);
        if (!compare(lastValue.current, next)) {
          lastValue.current = next;
          return next;
        }
        return lastValue.current!;
      } else {
        return selector(state);
      }
    };

    return React.useSyncExternalStore(
      this.subscribe,
      () => selectorWithMode(this.getState()),
      () => selectorWithMode(this.getState()),
    );
  };

  private subscribeToHooksStore() {
    this.hooksStore.addListener(() => {
      this.isFresh = false;

      this.microTaskBatcher.schedule(() => {
        this.notify();
      });
    });
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

function compare<T>(a: T, b: T) {
  if (typeof a === "object" && typeof b === "object") {
    return shallowEqual(a, b);
  }
  return a === b;
}
