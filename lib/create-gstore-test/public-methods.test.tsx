import { useState } from "react";
import { act } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createGStore } from "../index";

const createTestGStore = () =>
  createGStore(() => {
    const [counter, setCounter] = useState(0);

    const increase = () => setCounter((prevCounter) => prevCounter + 1);

    const reset = () => setCounter(0);

    const [user, setUser] = useState<{ name: string } | null>({ name: "John" });

    return {
      counter,
      increase,
      reset,
      user,
      setUser,
    };
  });

describe("Public methods of created useGStore", () => {
  describe("getState", () => {
    test("should return initial state with all methods and values when store is first created", () => {
      const useGStore = createTestGStore();

      const gState = useGStore.getState();

      expect(gState).toEqual(
        expect.objectContaining({
          counter: 0,
          increase: expect.any(Function),
          reset: expect.any(Function),
          user: { name: "John" },
          setUser: expect.any(Function),
        }),
      );
    });

    test("should reflect state changes when methods are called through getState", () => {
      const useGStore = createTestGStore();

      expect(useGStore.getState().counter).toBe(0);

      useGStore.getState().increase();
      expect(useGStore.getState().counter).toBe(1);

      useGStore.getState().increase();
      expect(useGStore.getState().counter).toBe(2);

      useGStore.getState().increase();

      expect(useGStore.getState()).toEqual(
        expect.objectContaining({
          counter: 3,
          increase: expect.any(Function),
          reset: expect.any(Function),
          user: { name: "John" },
          setUser: expect.any(Function),
        }),
      );
    });
  });

  describe("destroy", () => {
    test("should reset store state to initial values when destroy is called", () => {
      const useGStore = createTestGStore();

      expect(useGStore.getState().counter).toBe(0);

      useGStore.getState().increase();
      useGStore.getState().increase();
      useGStore.getState().increase();

      expect(useGStore.getState().counter).not.toBe(0);

      useGStore.destroy();

      expect(useGStore.getState()).toEqual(
        expect.objectContaining({
          counter: 0,
          increase: expect.any(Function),
          reset: expect.any(Function),
          user: { name: "John" },
          setUser: expect.any(Function),
        }),
      );
    });
  });

  describe("subscribe", () => {
    test("should notify subscribers when state changes through getState methods", async () => {
      const subscriber = vi.fn();

      const useGStore = createTestGStore();

      useGStore.subscribe(subscriber);

      expect(subscriber).not.toHaveBeenCalled();

      useGStore.getState();

      expect(subscriber).not.toHaveBeenCalled();

      await act(async () => useGStore.getState().increase());

      expect(subscriber).toHaveBeenCalledTimes(1);

      await act(async () => useGStore.getState().increase());
      await act(async () => useGStore.getState().increase());

      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    test("should stop notifying subscriber after unsubscribe is called", async () => {
      const subscriber = vi.fn();

      const useGStore = createTestGStore();

      const unsubscribe = useGStore.subscribe(subscriber);

      expect(subscriber).not.toHaveBeenCalled();

      useGStore.getState();

      expect(subscriber).not.toHaveBeenCalled();

      await act(async () => useGStore.getState().increase());

      expect(subscriber).toHaveBeenCalledOnce();

      unsubscribe();

      await act(async () => useGStore.getState().increase());
      await act(async () => useGStore.getState().increase());

      expect(subscriber).toHaveBeenCalledOnce();
    });
  });
});
