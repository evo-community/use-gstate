import { useReducer } from "react";
import "@testing-library/jest-dom";
import { describe, expect, vi, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { createGStore } from "../index";

const reducer = (
  state: { counter: number },
  action: { type: "INCREASE" | "RESET" },
) => {
  switch (action.type) {
    case "INCREASE": {
      return {
        ...state,
        counter: state.counter + 1,
      };
    }

    case "RESET": {
      return {
        ...state,
        counter: 0,
      };
    }

    default: {
      return state;
    }
  }
};

describe("useReducer in useGStore", () => {
  describe("Basic behavior", () => {
    const createTestComponents = ({
      renderHook,
    }: {
      renderHook?: (name: string) => void;
    } = {}) => {
      const useGStore = createGStore(() => {
        const [state, dispatch] = useReducer(reducer, { counter: 0 });

        return {
          state,
          dispatch,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ state }) => state.counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const CounterActions = () => {
        const dispatch = useGStore(({ dispatch }) => dispatch);
        const increase = () => dispatch({ type: "INCREASE" });
        const reset = () => dispatch({ type: "RESET" });

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
            <button typeof="button" data-testid="reset-button" onClick={reset}>
              Reset
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

      return {
        Counter,
        useGStore,
      };
    };

    test("should initialize counter component and render all child components correctly", () => {
      const renderHook = vi.fn();
      const { Counter, useGStore } = createTestComponents({ renderHook });

      render(<Counter />);

      const counterComponent = screen.getByTestId("counter");

      expect(counterComponent).toBeInTheDocument();
      expect(screen.getByTestId("counter-value")).toBeInTheDocument();
      expect(screen.getByTestId("increase-button")).toBeInTheDocument();

      const counterValueComponent = counterComponent.querySelector(
        '[data-testid="counter-value"]',
      );

      const increaseButtonComponent = counterComponent.querySelector(
        '[data-testid="increase-button"]',
      );

      expect(counterValueComponent).toBeInTheDocument();
      expect(counterValueComponent).toHaveTextContent("0");

      expect(increaseButtonComponent).toBeInTheDocument();

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledTimes(3);

      expect(useGStore.getState()).toEqual({
        state: { counter: 0 },
        dispatch: expect.any(Function),
      });
    });

    test("should increment counter each time increase button is clicked", async () => {
      const { Counter } = createTestComponents();

      render(<Counter />);

      const counterValueComponent = screen.getByTestId("counter-value");
      const increaseButtonComponent = screen.getByTestId("increase-button");

      expect(counterValueComponent).toHaveTextContent("0");

      expect(increaseButtonComponent).toBeInTheDocument();

      await userEvent.click(increaseButtonComponent);

      expect(counterValueComponent).toHaveTextContent("1");

      await userEvent.click(increaseButtonComponent);
      await userEvent.click(increaseButtonComponent);

      expect(counterValueComponent).toHaveTextContent("3");
    });

    test("should trigger rerenders only for components that subscribe to the changed counter state", async () => {
      const renderHook = vi.fn();
      const { Counter } = createTestComponents({ renderHook });

      render(<Counter />);

      const increaseButtonComponent = screen.getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledTimes(3);

      await userEvent.click(increaseButtonComponent);
      await userEvent.click(increaseButtonComponent);
      await userEvent.click(increaseButtonComponent);

      expect(renderHook).toHaveBeenCalledTimes(6);
    });
  });

  describe.skip("Reducer initialization with initializer function", () => {
    const initialCounter = 0;
    const createInitialState = (counter: number) => ({ counter });
    const createTestComponents = ({
      renderHook,
    }: {
      renderHook?: (name: string) => void;
    } = {}) => {
      const useGStore = createGStore(() => {
        const [state, dispatch] = useReducer(
          reducer,
          initialCounter,
          createInitialState,
        );

        return {
          state,
          dispatch,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ state }) => state.counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const CounterActions = () => {
        const dispatch = useGStore(({ dispatch }) => dispatch);
        const increase = () => dispatch({ type: "INCREASE" });
        const reset = () => dispatch({ type: "RESET" });

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
            <button typeof="button" data-testid="reset-button" onClick={reset}>
              Reset
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

      return {
        Counter,
        useGStore,
      };
    };

    test("should initialize state correctly using the initializer function", () => {
      const renderHook = vi.fn();
      const { Counter, useGStore } = createTestComponents({ renderHook });

      render(<Counter />);

      expect(useGStore.getState()).toEqual({
        state: { counter: 0 },
        dispatch: expect.any(Function),
      });
    });
  });
});
