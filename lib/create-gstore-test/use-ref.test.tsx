import { act, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createGStore } from "../index";

const nextTask = () => new Promise((resolve) => setTimeout(resolve));

const nextMicrotask = () => Promise.resolve();

describe("useRef in useGStore", () => {
  describe("Basic behavior with primitive value in ref object", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const numberRef = useRef<null | number | undefined>(null);

        return {
          numberRef,
          counter,
          setCounter,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const NumberRefActions = () => {
        const numberRef = useGStore(({ numberRef }) => numberRef);

        renderHook?.("number-ref-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="set-zero-button"
              onClick={() => {
                numberRef.current = 0;
              }}
            >
              Set ref 0
            </button>
            <button
              typeof="button"
              data-testid="set-undefined-button"
              onClick={() => {
                numberRef.current = undefined;
              }}
            >
              Set ref undefined
            </button>
          </div>
        );
      };

      const Counter = () => {
        renderHook?.("counter");

        return (
          <div data-testid={"counter"}>
            <CounterValue />
            <NumberRefActions />
          </div>
        );
      };

      return { useGStore, Counter };
    };

    test("should initialize store state with initial ref value", () => {
      const { Counter, useGStore } = createTestStore();

      const { getByTestId } = render(<Counter />);

      expect(getByTestId("counter")).toBeInTheDocument();
      expect(getByTestId("counter-value")).toBeInTheDocument();
      expect(getByTestId("set-zero-button")).toBeInTheDocument();
      expect(getByTestId("set-undefined-button")).toBeInTheDocument();

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        numberRef: {
          current: null,
        },
      });
    });

    test("should render all components in correct order on initial mount", () => {
      const renderHook = vi.fn();

      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      render(<Counter />);

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("number-ref-actions");
      expect(renderHook).toHaveBeenCalledTimes(3);
    });

    test("should update ref value without triggering component rerenders when clicking buttons", async () => {
      const renderHook = vi.fn();

      const { Counter, useGStore } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(<Counter />);

      const setZeroButton = getByTestId("set-zero-button");
      const setUndefinedButton = getByTestId("set-undefined-button");

      expect(renderHook).toHaveBeenCalledTimes(3);

      await userEvent.click(setZeroButton);

      expect(useGStore.getState().numberRef).toEqual({ current: 0 });

      await userEvent.click(setUndefinedButton);

      expect(useGStore.getState().numberRef).toEqual({ current: undefined });

      await nextTask();

      expect(renderHook).toHaveBeenCalledTimes(3);
    });

    test("should update ref value without triggering component rerenders when modifying ref outside components", async () => {
      const renderHook = vi.fn();

      const { Counter, useGStore } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      render(<Counter />);

      expect(renderHook).toHaveBeenCalledTimes(3);

      await act(async () => {
        useGStore.getState().numberRef.current = 0;
      });

      expect(useGStore.getState().numberRef).toEqual({ current: 0 });

      await act(async () => {
        useGStore.getState().numberRef.current = undefined;
      });

      expect(useGStore.getState().numberRef).toEqual({ current: undefined });

      await nextTask();

      expect(renderHook).toHaveBeenCalledTimes(3);
    });

    test("should maintain the same ref object reference across multiple counter updates", async () => {
      const renderHook = vi.fn();

      const { Counter, useGStore } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      render(<Counter />);

      const initialNumberRef = useGStore.getState().numberRef;

      expect(renderHook).toHaveBeenCalledTimes(3);

      await act(async () => useGStore.getState().setCounter(1));
      await act(async () => useGStore.getState().setCounter(2));
      await act(async () => useGStore.getState().setCounter(3));

      expect(renderHook).toHaveBeenCalledTimes(6);

      await nextTask();

      expect(useGStore.getState().numberRef).toEqual(initialNumberRef);
    });
  });

  describe("Attach ref to DOM object", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const inputRef = useRef<HTMLInputElement>(null);

        return {
          counter,
          setCounter,
          inputRef,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const CounterActions = () => {
        const setCounter = useGStore(({ setCounter }) => setCounter);

        renderHook?.("counter-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="increase-button"
              onClick={() => setCounter((prev) => prev + 1)}
            >
              Increase
            </button>
          </div>
        );
      };

      const Counter = () => {
        renderHook?.("counter");

        return (
          <div data-testid={"counter"}>
            <CounterActions />
            <CounterValue />
          </div>
        );
      };

      const Input = () => {
        const inputRef = useGStore(({ inputRef }) => inputRef);

        renderHook?.("input");

        return <input ref={inputRef} data-testid={"input"} />;
      };

      return { useGStore, Counter, Input };
    };

    test("should initialize store with ref attached to DOM element", () => {
      const { Counter, Input, useGStore } = createTestStore();

      const { getByTestId } = render(
        <div>
          <Counter />
          <Input />
        </div>,
      );

      expect(getByTestId("counter")).toBeInTheDocument();
      expect(getByTestId("counter-value")).toBeInTheDocument();
      expect(getByTestId("increase-button")).toBeInTheDocument();
      expect(getByTestId("input")).toBeInTheDocument();

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        inputRef: {
          current: expect.any(HTMLInputElement),
        },
      });
    });

    test("should render all components in correct order on initial mount", () => {
      const renderHook = vi.fn();

      const { Counter, Input } = createTestStore({ renderHook });

      render(
        <div>
          <Counter />
          <Input />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledWith("input");

      expect(renderHook).toHaveBeenCalledTimes(4);
    });

    test("should maintain the same input element reference when counter state changes", async () => {
      const renderHook = vi.fn();

      const { Counter, Input, useGStore } = createTestStore({ renderHook });

      const { getByTestId } = render(
        <div>
          <Counter />
          <Input />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledTimes(4);

      const initialInputRef = useGStore.getState().inputRef;

      const increaseButton = getByTestId("increase-button");

      await userEvent.click(increaseButton);

      expect(renderHook).toHaveBeenCalledTimes(5);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      expect(renderHook).toHaveBeenCalledTimes(7);

      expect(useGStore.getState().inputRef).toBe(initialInputRef);
      expect(useGStore.getState().inputRef.current).toBe(getByTestId("input"));
    });

    test("should maintain the same input element reference and prevent rerenders when typing in input", async () => {
      const renderHook = vi.fn();

      const { Counter, Input, useGStore } = createTestStore({ renderHook });

      const { getByTestId } = render(
        <div>
          <Counter />
          <Input />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledTimes(4);

      const initialInputRef = useGStore.getState().inputRef;

      expect(initialInputRef.current?.value).toBe("");

      const inputElement = getByTestId("input");

      await userEvent.type(inputElement, "val");

      await userEvent.type(inputElement, "u");
      await userEvent.type(inputElement, "e");

      expect(renderHook).toHaveBeenCalledTimes(4);

      expect(useGStore.getState().inputRef).toBe(initialInputRef);
      expect(initialInputRef.current?.value).toBe("value");
    });

    test("should set input ref to null when component unmounts", () => {
      const { Counter, Input, useGStore } = createTestStore();

      const { unmount } = render(
        <div>
          <Counter />
          <Input />
        </div>,
      );

      expect(useGStore.getState().inputRef).toEqual({
        current: expect.any(HTMLInputElement),
      });

      unmount();

      expect(useGStore.getState().inputRef).toEqual({
        current: null,
      });
    });
  });

  describe("with useEffect and useLayoutEffect", () => {
    const createTestStore = (
      {
        effectHook,
        cleanupEffectHook,
        layoutEffectHook,
        cleanupLayoutEffectHook,
      }: {
        effectHook?: (node: unknown) => void;
        cleanupEffectHook?: (node: unknown) => void;
        layoutEffectHook?: (node: unknown) => void;
        cleanupLayoutEffectHook?: (node: unknown) => void;
      } = {},
      { destroy }: { destroy?: "on-all-unsubscribed" } = {},
    ) => {
      const useGStore = createGStore(
        () => {
          const [counter, setCounter] = useState(0);

          const inputRef = useRef<HTMLInputElement>(null);

          useLayoutEffect(() => {
            layoutEffectHook?.(inputRef.current);
            return () => {
              /* eslint-disable-next-line react-hooks/exhaustive-deps */
              cleanupLayoutEffectHook?.(inputRef.current);
            };
          }, []);

          useEffect(() => {
            effectHook?.(inputRef.current);
            return () => {
              /* eslint-disable-next-line react-hooks/exhaustive-deps */
              cleanupEffectHook?.(inputRef.current);
            };
          }, []);

          return {
            counter,
            setCounter,
            inputRef,
          };
        },
        { destroy },
      );

      const Input = () => {
        const inputRef = useGStore(({ inputRef }) => inputRef);

        return <input ref={inputRef} data-testid={"input"} />;
      };

      return { useGStore, Input };
    };

    test("should call layout effect before regular effect with correct input element reference", async () => {
      const effectHook = vi.fn();
      const layoutEffectHook = vi.fn();
      const cleanupEffectHook = vi.fn();
      const cleanupLayoutEffectHook = vi.fn();

      const { Input } = createTestStore({
        effectHook,
        cleanupEffectHook,
        layoutEffectHook,
        cleanupLayoutEffectHook,
      });

      const { getByTestId } = render(<Input />);

      const inputElement = getByTestId("input");

      expect(layoutEffectHook).not.toHaveBeenCalled();
      expect(effectHook).not.toHaveBeenCalled();

      await nextMicrotask();

      expect(layoutEffectHook).toHaveBeenCalledTimes(1);
      expect(layoutEffectHook).toHaveBeenCalledWith(inputElement);
      expect(effectHook).not.toHaveBeenCalled();

      await nextTask();

      expect(layoutEffectHook).toHaveBeenCalledTimes(1);
      expect(layoutEffectHook).toHaveBeenCalledWith(inputElement);
      expect(effectHook).toHaveBeenCalledTimes(1);
      expect(effectHook).toHaveBeenCalledWith(inputElement);

      expect(cleanupEffectHook).not.toHaveBeenCalled();
      expect(cleanupLayoutEffectHook).not.toHaveBeenCalled();
    });

    test("should call cleanup effects with null reference when store is destroyed on unmount", async () => {
      const effectHook = vi.fn();
      const layoutEffectHook = vi.fn();
      const cleanupEffectHook = vi.fn();
      const cleanupLayoutEffectHook = vi.fn();

      const { Input } = createTestStore(
        {
          effectHook,
          cleanupEffectHook,
          layoutEffectHook,
          cleanupLayoutEffectHook,
        },
        { destroy: "on-all-unsubscribed" },
      );

      const { unmount } = render(<Input />);

      await nextTask();

      expect(layoutEffectHook).toHaveBeenCalledTimes(1);
      expect(effectHook).toHaveBeenCalledTimes(1);

      expect(cleanupLayoutEffectHook).not.toHaveBeenCalled();
      expect(cleanupEffectHook).not.toHaveBeenCalled();

      unmount();

      expect(layoutEffectHook).toHaveBeenCalledTimes(1);
      expect(effectHook).toHaveBeenCalledTimes(1);
      expect(cleanupLayoutEffectHook).toHaveBeenCalledTimes(1);
      expect(cleanupLayoutEffectHook).toHaveBeenCalledWith(null);
      expect(cleanupEffectHook).toHaveBeenCalledTimes(1);
      expect(cleanupEffectHook).toHaveBeenCalledWith(null);
    });
  });
});
