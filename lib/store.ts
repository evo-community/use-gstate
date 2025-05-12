/* eslint-disable react-hooks/rules-of-hooks */
import * as React from "react";
import { hooksContext } from "./hooks";
import { HooksStore } from "./hooks/hooks-store";
import { shallowEqual } from "./shallow-equal";
import { SyncStore, SyncStoreListener } from "./sync-store";

export type GStoreOptions = {
  onSubscribed?: (subscribers: number) => void;
  onUnsubscribed?: (subscribers: number) => void;
  onFirstSubscribed?: () => void;
  onAllUnsubscribed?: () => void;
  initialize?: "lazy" | "eager";
  destroy?: "no" | "on-all-unsubscribed";
};

export class GStore<T> {
  private hooksStore = new HooksStore();
  private unsubscribeHooksStore: () => void = () => {};
  private stateStore: SyncStore<T> | undefined = undefined;
  private listeners = new Set<SyncStoreListener<T>>();
  private isInitialized = false;

  constructor(
    private stateFactory: () => T,
    private options: GStoreOptions = {},
  ) {
    this.options.destroy ??= "no";
    this.options.initialize ??= "lazy";

    if (this.options.initialize === "eager") {
      this.initialize();
    }
  }

  initialize() {
    if (this.isInitialized) return;

    const result = hooksContext.runInContext(
      () => this.stateFactory(),
      this.hooksStore,
    );

    // Инициализируем стейт с результатом
    this.stateStore = new SyncStore(result);
    this.stateStore.subscribe((params) =>
      this.listeners.forEach((listener) => listener(params)),
    );

    // Подбисываемся на изменения состояний
    this.unsubscribeHooksStore = this.hooksStore.addListener(() => {
      if (!this.stateStore) {
        throw new Error("State store is not initialized");
      }

      const last = this.stateStore.getValue();
      const next = hooksContext.runInContext(
        () => this.stateFactory(),
        this.hooksStore,
      );

      if (!compare(last, next)) {
        this.stateStore.setValue(next);
      }
    });

    this.isInitialized = true;
  }

  destroy() {
    if (!this.isInitialized) return;

    this.unsubscribeHooksStore();
    this.hooksStore.destroy();
    this.stateStore = undefined;
    this.isInitialized = false;
  }

  getState() {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.stateStore!.getValue();
  }

  setState(state: T) {
    if (!this.isInitialized) {
      this.initialize();
    }
    this.stateStore!.setValue(state);
  }

  subscribe = (callback: SyncStoreListener<T>) => {
    if (!this.isInitialized) {
      this.initialize();
    }

    this.listeners.add(callback);
    this.options?.onSubscribed?.(this.listeners.size);

    if (this.listeners.size === 1) {
      this.options?.onFirstSubscribed?.();
    }

    return () => {
      this.listeners.delete(callback);
      this.options?.onUnsubscribed?.(this.listeners.size);

      if (this.listeners.size === 0) {
        this.options?.onAllUnsubscribed?.();
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
}

function compare<T>(a: T, b: T) {
  if (typeof a === "object" && typeof b === "object") {
    return shallowEqual(a, b);
  }
  return a === b;
}
