import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { createGStore } from "../index";

describe("useGStore mode", () => {
  describe("strict mode by default", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);
        const value = 1;

        return {
          counter,
          setCounter,
          value,
          nonMemoizedObject: { value },
          nonMemoizedArray: [value],
        };
      });

      const Counter = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter");

        return <div>{counter}</div>;
      };

      const ValueFromObject = () => {
        const { value } = useGStore(
          ({ nonMemoizedObject }) => nonMemoizedObject,
        );

        renderHook?.("value-from-object");

        return <div>{value}</div>;
      };

      const ValueFromArray = () => {
        const [value] = useGStore(({ nonMemoizedArray }) => nonMemoizedArray);

        renderHook?.("value-from-array");

        return <div>{value}</div>;
      };

      return {
        useGStore,
        Counter,
        ValueFromArray,
        ValueFromObject,
      };
    };

    test("should initialize store with correct initial state and render all components", () => {
      const renderHook = vi.fn();
      const { ValueFromObject, ValueFromArray, Counter, useGStore } =
        createTestStore({
          renderHook,
        });

      render(
        <div>
          <Counter />
          <ValueFromArray />
          <ValueFromObject />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("value-from-array");
      expect(renderHook).toHaveBeenCalledWith("value-from-object");
      expect(renderHook).toHaveBeenCalledTimes(3);

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        value: 1,
        nonMemoizedObject: { value: 1 },
        nonMemoizedArray: [1],
      });
    });

    test("should trigger rerenders in all components on any state update in strict mode", async () => {
      const renderHook = vi.fn();
      const { ValueFromObject, ValueFromArray, Counter, useGStore } =
        createTestStore({
          renderHook,
        });

      render(
        <div>
          <Counter />
          <ValueFromArray />
          <ValueFromObject />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledTimes(3);

      await act(async () => useGStore.getState().setCounter(1));

      expect(renderHook).toHaveBeenCalledTimes(6);

      await act(async () => useGStore.getState().setCounter(2));
      await act(async () => useGStore.getState().setCounter(3));

      expect(renderHook).toHaveBeenCalledTimes(12);
    });

    test("should throw error when using non-memoized object as selector return value in strict mode", () => {
      const { useGStore } = createTestStore();

      const Component = () => {
        const { value } = useGStore(({ value }) => ({ value }));

        return <div>{value}</div>;
      };

      try {
        render(<Component />);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("should throw error when using non-memoized array as selector return value in strict mode", () => {
      const { useGStore } = createTestStore();

      const Component = () => {
        const [value] = useGStore(({ value }) => [value]);

        return <div>{value}</div>;
      };

      try {
        render(<Component />);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("shallow mode", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);
        const value = 1;

        return {
          counter,
          setCounter,
          value,
          nonMemoizedObject: { value },
          nonMemoizedArray: [value],
        };
      });

      const Counter = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter");

        return <div>{counter}</div>;
      };

      const ValueFromObject = () => {
        const nonMemoizedObject = useGStore(
          ({ nonMemoizedObject }) => nonMemoizedObject,
          "shallow",
        );
        const nonMemoizedObjectSelector = useGStore(
          ({ value }) => ({ value }),
          "shallow",
        );

        renderHook?.("value-from-object");

        return (
          <div>
            {nonMemoizedObject.value} {nonMemoizedObjectSelector.value}
          </div>
        );
      };

      const ValueFromArray = () => {
        const nonMemoizedArray = useGStore(
          ({ nonMemoizedArray }) => nonMemoizedArray,
          "shallow",
        );
        const nonMemoizedArraySelector = useGStore(
          ({ value }) => [value],
          "shallow",
        );

        renderHook?.("value-from-array");

        return (
          <div>
            {nonMemoizedArray[0]} {nonMemoizedArraySelector[0]}
          </div>
        );
      };

      return {
        useGStore,
        Counter,
        ValueFromArray,
        ValueFromObject,
      };
    };

    test("should initialize store with correct initial state and render all components in shallow mode", () => {
      const renderHook = vi.fn();
      const { ValueFromArray, ValueFromObject, Counter, useGStore } =
        createTestStore({
          renderHook,
        });

      render(
        <div>
          <Counter />
          <ValueFromArray />
          <ValueFromObject />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("value-from-array");
      expect(renderHook).toHaveBeenCalledWith("value-from-object");
      expect(renderHook).toHaveBeenCalledTimes(3);

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        value: 1,
        nonMemoizedObject: { value: 1 },
        nonMemoizedArray: [1],
      });
    });

    test("should only rerender components that directly depend on changed state in shallow mode", async () => {
      const renderHook = vi.fn();
      const { ValueFromArray, ValueFromObject, Counter, useGStore } =
        createTestStore({
          renderHook,
        });

      render(
        <div>
          <Counter />
          <ValueFromArray />
          <ValueFromObject />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledTimes(3);

      await act(async () => useGStore.getState().setCounter(1));

      expect(renderHook).toHaveBeenCalledTimes(4);

      await act(async () => useGStore.getState().setCounter(2));
      await act(async () => useGStore.getState().setCounter(3));

      expect(renderHook).toHaveBeenCalledTimes(6);
    });
  });
});
