import { act } from "@testing-library/react";
import {
  createGStore,
  useCallback,
  useState,
  useEffect,
  useOnSubscribed,
  useOnAllUnsubscribed,
  useOnFirstSubscribed,
  useOnUnsubscribed,
} from "../index";
import { nextTask } from "./lib";

afterEach(() => {
  vi.clearAllMocks();
});

const createTestGStore = ({
  onSubscribed,
  onFirstSubscribed,
  onUnsubscribed,
  onAllUnsubscribed,
}: {
  onSubscribed: () => void;
  onFirstSubscribed: () => void;
  onUnsubscribed: () => void;
  onAllUnsubscribed: () => void;
}) =>
  createGStore(() => {
    const [counter, setCounter] = useState(0);

    const increase = useCallback(
      () => setCounter((prevCounter) => prevCounter + 1),
      [],
    );

    useEffect(() => {
      /* */
    }, [counter]);

    useOnSubscribed(onSubscribed);
    useOnFirstSubscribed(onFirstSubscribed);
    useOnAllUnsubscribed(onAllUnsubscribed);
    useOnUnsubscribed(onUnsubscribed);

    return {
      counter,
      increase,
    };
  });

describe("Subscription event hooks", async () => {
  test("Should trigger subscription hooks in correct order with proper subscriber counts", async () => {
    const onSubscribed = vi.fn();
    const onFirstSubscribed = vi.fn();
    const onUnsubscribed = vi.fn();
    const onAllUnsubscribed = vi.fn();
    const useGStore = createTestGStore({
      onSubscribed,
      onFirstSubscribed,
      onUnsubscribed,
      onAllUnsubscribed,
    });

    expect(onSubscribed).not.toHaveBeenCalled();
    expect(onFirstSubscribed).not.toHaveBeenCalled();

    useGStore.getState();

    expect(onSubscribed).not.toHaveBeenCalled();
    expect(onFirstSubscribed).not.toHaveBeenCalled();

    const unsubscribe1 = useGStore.subscribe(() => null);

    expect(onFirstSubscribed).toHaveBeenCalledTimes(1);
    expect(onFirstSubscribed).toHaveBeenLastCalledWith(undefined);
    expect(onSubscribed).toHaveBeenCalledTimes(1);
    expect(onSubscribed).toHaveBeenLastCalledWith(1);

    const unsubscribe2 = useGStore.subscribe(() => null);
    const unsubscribe3 = useGStore.subscribe(() => null);

    expect(onSubscribed).toHaveBeenCalledTimes(3);

    expect(onUnsubscribed).not.toHaveBeenCalled();
    expect(onAllUnsubscribed).not.toHaveBeenCalled();

    unsubscribe1();

    expect(onUnsubscribed).toHaveBeenCalledTimes(1);
    expect(onUnsubscribed).toHaveBeenLastCalledWith(2);

    unsubscribe2();

    expect(onAllUnsubscribed).not.toHaveBeenCalled();

    unsubscribe3();

    expect(onFirstSubscribed).toHaveBeenCalledTimes(1);
    expect(onFirstSubscribed).toHaveBeenLastCalledWith(undefined);

    expect(onSubscribed).toHaveBeenCalledTimes(3);
    expect(onSubscribed).toHaveBeenLastCalledWith(3);

    expect(onUnsubscribed).toHaveBeenCalledTimes(3);
    expect(onUnsubscribed).toHaveBeenLastCalledWith(0);

    expect(onAllUnsubscribed).toHaveBeenCalledTimes(1);
    expect(onAllUnsubscribed).toHaveBeenLastCalledWith(undefined);
  });

  test("State updates should not affect subscription hook behavior", async () => {
    const onSubscribed = vi.fn();
    const onFirstSubscribed = vi.fn();
    const onUnsubscribed = vi.fn();
    const onAllUnsubscribed = vi.fn();
    const useGStore = createTestGStore({
      onSubscribed,
      onFirstSubscribed,
      onUnsubscribed,
      onAllUnsubscribed,
    });

    useGStore.getState();

    await act(async () => useGStore.getState().increase());
    await nextTask();

    const unsubscribe1 = useGStore.subscribe(() => null);

    await act(async () => useGStore.getState().increase());
    await nextTask();

    const unsubscribe2 = useGStore.subscribe(() => null);
    const unsubscribe3 = useGStore.subscribe(() => null);

    await act(async () => useGStore.getState().increase());
    await nextTask();

    unsubscribe1();
    unsubscribe2();
    unsubscribe3();

    expect(onFirstSubscribed).toHaveBeenCalledTimes(1);
    expect(onFirstSubscribed).toHaveBeenLastCalledWith(undefined);

    expect(onSubscribed).toHaveBeenCalledTimes(3);
    expect(onSubscribed).toHaveBeenLastCalledWith(3);

    expect(onUnsubscribed).toHaveBeenCalledTimes(3);
    expect(onUnsubscribed).toHaveBeenLastCalledWith(0);

    expect(onAllUnsubscribed).toHaveBeenCalledTimes(1);
    expect(onAllUnsubscribed).toHaveBeenLastCalledWith(undefined);
  });
});
