import { useCallback, useState } from "react";
import { describe, test, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { createGStore } from "../index";
import { userEvent } from "@testing-library/user-event";

describe("useCallback in useGStore", () => {
  describe("non-memoized callback", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const increase = () => {
          setCounter((prevCounter) => prevCounter + 1);
        };

        return {
          counter,
          increase,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const CounterActions = () => {
        const increase = useGStore(({ increase }) => increase);

        renderHook?.("counter-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="increase-button"
              onClick={increase}
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

      return { useGStore, Counter };
    };

    test("should render all components with correct initial state and structure", () => {
      const { useGStore, Counter } = createTestStore();

      const { getByTestId } = render(<Counter />);

      const counter = getByTestId("counter");
      const counterValue = getByTestId("counter-value");
      const increaseButton = getByTestId("increase-button");

      expect(counter).toBeInTheDocument();
      expect(counterValue).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();

      expect(counter.contains(increaseButton)).toBe(true);
      expect(counter.contains(counterValue)).toBe(true);

      expect(counterValue).toHaveTextContent("0");

      expect(useGStore.getState()).toEqual({
        counter: 0,
        increase: expect.any(Function),
      });
    });

    test("should trigger initial render for all components exactly once", () => {
      const renderHook = vi.fn();
      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      render(<Counter />);

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledTimes(3);
    });

    test("should trigger re-renders for both value and action components on each state update", async () => {
      const renderHook = vi.fn();
      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(<Counter />);

      const increaseButton = getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledTimes(3);

      await userEvent.click(increaseButton);

      // rerenders counter value and counter actions
      expect(renderHook).toHaveBeenCalledTimes(5);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      expect(renderHook).toHaveBeenCalledTimes(9);

      expect(getByTestId("counter-value")).toHaveTextContent("3");
    });
  });

  describe("memoized callback with empty dependencies array", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const increase = useCallback(() => {
          setCounter((prevCounter) => prevCounter + 1);
        }, []);

        return {
          counter,
          increase,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const CounterActions = () => {
        const increase = useGStore(({ increase }) => increase);

        renderHook?.("counter-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="increase-button"
              onClick={increase}
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

      return { useGStore, Counter };
    };

    test("should render all components with correct initial state and structure", () => {
      const { useGStore, Counter } = createTestStore();

      const { getByTestId } = render(<Counter />);

      const counter = getByTestId("counter");
      const counterValue = getByTestId("counter-value");
      const increaseButton = getByTestId("increase-button");

      expect(counter).toBeInTheDocument();
      expect(counterValue).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();

      expect(counter.contains(increaseButton)).toBe(true);
      expect(counter.contains(counterValue)).toBe(true);

      expect(counterValue).toHaveTextContent("0");

      expect(useGStore.getState()).toEqual({
        counter: 0,
        increase: expect.any(Function),
      });
    });

    test("should trigger initial render for all components exactly once", () => {
      const renderHook = vi.fn();
      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      render(<Counter />);

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledTimes(3);
    });

    test("should only trigger re-renders for value component when state updates, keeping action component stable", async () => {
      const renderHook = vi.fn();
      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(<Counter />);

      const increaseButton = getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledTimes(3);

      await userEvent.click(increaseButton);

      // rerenders counter value only
      expect(renderHook).toHaveBeenCalledTimes(4);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      expect(renderHook).toHaveBeenCalledTimes(6);

      expect(getByTestId("counter-value")).toHaveTextContent("3");
    });
  });

  describe("memoized callback with dependency", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const isCounterMoreThanTwo = counter > 2;

        const increase = useCallback(() => {
          setCounter((prevCounter) => prevCounter + 1);
          /* eslint-disable-next-line react-hooks/exhaustive-deps */
        }, [isCounterMoreThanTwo]);

        return {
          counter,
          increase,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const CounterActions = () => {
        const increase = useGStore(({ increase }) => increase);

        renderHook?.("counter-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="increase-button"
              onClick={increase}
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

      return { useGStore, Counter };
    };

    test("should render all components with correct initial state and structure", () => {
      const { useGStore, Counter } = createTestStore();

      const { getByTestId } = render(<Counter />);

      const counter = getByTestId("counter");
      const counterValue = getByTestId("counter-value");
      const increaseButton = getByTestId("increase-button");

      expect(counter).toBeInTheDocument();
      expect(counterValue).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();

      expect(counter.contains(increaseButton)).toBe(true);
      expect(counter.contains(counterValue)).toBe(true);

      expect(counterValue).toHaveTextContent("0");

      expect(useGStore.getState()).toEqual({
        counter: 0,
        increase: expect.any(Function),
      });
    });

    test("should trigger initial render for all components exactly once", () => {
      const renderHook = vi.fn();
      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      render(<Counter />);

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledTimes(3);
    });

    test("should trigger re-renders for value component on each update and action component when dependency changes", async () => {
      const renderHook = vi.fn();
      const { Counter } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(<Counter />);

      const increaseButton = getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledTimes(3);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      // rerenders counter value only
      expect(renderHook).toHaveBeenCalledTimes(5);

      await userEvent.click(increaseButton);

      // additional render - recreated increase callback
      expect(renderHook).toHaveBeenCalledTimes(7);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      // rerenders counter value only
      expect(renderHook).toHaveBeenCalledTimes(9);

      expect(getByTestId("counter-value")).toHaveTextContent("5");
    });
  });
});
