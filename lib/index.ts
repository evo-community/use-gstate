import { GStore, GStoreOptions, Listener } from "./store";

type GStoreHook<State> = {
  (): State;
  <R>(select: (state: State) => R, mode?: "shallow" | "strict"): R;

  getState: () => State;
  subscribe: (callback: Listener) => () => void;
  destroy: () => void;
};

function createGStore<State>(
  fn: () => State,
  options?: GStoreOptions,
): GStoreHook<State>;
function createGStore(stateFactory: any, storeOptions = {}) {
  const store = new GStore(stateFactory, storeOptions);

  function useStateHook(
    selector?: (state: any) => any,
    mode?: "shallow" | "strict",
  ) {
    return store.useReact(selector, mode);
  }

  useStateHook.destroy = () => {
    store.destroy();
  };

  useStateHook.getState = () => {
    return store.getState();
  };

  useStateHook.subscribe = (callback: Listener) => {
    return store.subscribe(callback);
  };

  return useStateHook;
}

export { createGStore, type GStoreOptions, type GStoreHook, GStore };

export {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  useContext,
  useReducer,
  useOnSubscribed,
  useOnFirstSubscribed,
  useOnUnsubscribed,
  useOnAllUnsubscribed,
} from "./hooks";
