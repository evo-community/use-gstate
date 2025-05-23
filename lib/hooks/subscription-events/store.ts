export type SubscriptionCallback = (listenersCount: number | undefined) => void;

export type SubscriptionEventName =
  | "subscribed"
  | "first-subscribed"
  | "unsubscribed"
  | "all-unsubscribed";

type SubscriptionEvent = {
  name: SubscriptionEventName;
  callback: SubscriptionCallback | undefined;
};

export type RunAllCallbacksPayload =
  | {
      name: "subscribed" | "unsubscribed";
      listenersCount: number;
    }
  | {
      name: "first-subscribed" | "all-unsubscribed";
      listenersCount?: never;
    };

export class SubscriptionEventsStore {
  private events: SubscriptionEvent[] = new Array(30);
  private eventIndex = -1;

  public next() {
    this.eventIndex++;
  }

  public reset() {
    this.eventIndex = -1;
  }

  public scheduleCallback(
    callback: SubscriptionCallback | undefined,
    eventName: SubscriptionEventName,
  ) {
    let subscriptionEvent = this.events[this.eventIndex] as
      | SubscriptionEvent
      | undefined;

    if (!subscriptionEvent) {
      subscriptionEvent = {
        name: eventName,
        callback,
      };
      this.events[this.eventIndex] = subscriptionEvent;
    } else {
      subscriptionEvent.callback = callback;
    }
  }

  public destroy() {
    this.eventIndex = -1;
    this.events.length = 0;
  }

  public runAllCallbacks({ name, listenersCount }: RunAllCallbacksPayload) {
    this.events
      .filter((subscriptionState) => subscriptionState.name === name)
      .forEach((subscriptionState) => {
        subscriptionState.callback?.(listenersCount);
      });
  }
}
