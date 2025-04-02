import * as React from "react";
import { HooksContext } from ".";
import { shallowEqualArrays } from "../shallow-equal";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ReactSharedInternals =
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

export class ReactHooksMock {
  constructor(private context: HooksContext) {}

  private useState: typeof React.useState = (initialState?: any): any => {
    const store = this.context.getTopState();
    store.next();
    return store.getCurrent(initialState);
  };

  private useRef: typeof React.useRef = (initialState?: any): any => {
    const [res] = this.useState({ current: initialState });
    return res;
  };

  private useMemo: typeof React.useMemo = (fn: () => any, deps: any) => {
    const [res] = this.useState(() => ({ res: fn(), deps }));

    if (!shallowEqualArrays(res.deps, deps)) {
      res.res = fn();
      res.deps = deps;

      return res.res;
    }

    return res.res;
  };

  private useCallback: typeof React.useCallback = (fn: any, deps: any) => {
    return this.useMemo(() => fn, deps);
  };

  private useEffect: typeof React.useEffect = (fn: any, deps: any) => {
    const store = this.context.getTopState();
    store.next();
    store.scheduleEffect({ fn, deps, type: "effect" });
  };

  private useLayoutEffect: typeof React.useEffect = (fn: any, deps: any) => {
    const store = this.context.getTopState();
    store.next();
    store.scheduleEffect({ fn, deps, type: "layout-effect" });
  };

  private useSyncExternalStore: typeof React.useSyncExternalStore = (
    subscribe: any,
    getSnapshot: any,
    getServerSnapshot: any
  ) => {
    if (typeof window === "undefined") {
      return getServerSnapshot();
    }

    const snapshot = getSnapshot();

    const [state, setState] = this.useState({
      count: 0,
      lastSnapshot: snapshot,
    });

    this.useEffect(() => {
      return subscribe(() => {
        const newSnapshot = getSnapshot();
        if (state.lastSnapshot !== newSnapshot) {
          setState((s) => ({
            ...s,
            lastSnapshot: newSnapshot,
            count: s.count + 1,
          }));
          return;
        }
      });
    });

    return snapshot;
  };

  applyHooks() {
    const last = { ...ReactSharedInternals.H };

    ReactSharedInternals.H.useState = this.useState;
    ReactSharedInternals.H.useRef = this.useRef;
    ReactSharedInternals.H.useMemo = this.useMemo;
    ReactSharedInternals.H.useCallback = this.useCallback;
    ReactSharedInternals.H.useEffect = this.useEffect;
    ReactSharedInternals.H.useLayoutEffect = this.useLayoutEffect;
    ReactSharedInternals.H.useSyncExternalStore = this.useSyncExternalStore;

    return () => {
      Object.assign(ReactSharedInternals.H, last);
    };
  }
}
