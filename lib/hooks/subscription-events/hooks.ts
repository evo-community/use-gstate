import { getTopState } from "../hooks-stores-state-stack";

export const useOnSubscribed: (fn: (listenersCount: number) => void) => void = (
  fn?: (listenersCount: any) => void,
) => {
  const store = getTopState();
  store.nextSubscriptionEvent();
  store.scheduleSubscriptionEventCallback(fn, "subscribed");
};

export const useOnFirstSubscribed: (fn: () => void) => void = (
  fn?: () => void,
) => {
  const store = getTopState();
  store.nextSubscriptionEvent();
  store.scheduleSubscriptionEventCallback(fn, "first-subscribed");
};

export const useOnUnsubscribed: (
  fn: (listenersCount: number) => void,
) => void = (fn?: (listenersCount: any) => void) => {
  const store = getTopState();
  store.nextSubscriptionEvent();
  store.scheduleSubscriptionEventCallback(fn, "unsubscribed");
};

export const useOnAllUnsubscribed: (fn: () => void) => void = (
  fn?: () => void,
) => {
  const store = getTopState();
  store.nextSubscriptionEvent();
  store.scheduleSubscriptionEventCallback(fn, "all-unsubscribed");
};
