import { useMemo, useState } from "react";
import { describe, test, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { createGStore } from "../index";
import { userEvent } from "@testing-library/user-event";

describe("useMemo in useGStore", () => {
  describe("non-memoized object", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const user = {
          name: "John",
        };

        return {
          user,
          counter,
          setCounter,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const User = () => {
        const user = useGStore(({ user }) => user);

        renderHook?.("user");

        return (
          <div data-testid="user">
            <div data-testid="usernames">{user.name}</div>
          </div>
        );
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

      return { useGStore, Counter, User };
    };

    test("should render components with initial state and verify DOM structure", () => {
      const { useGStore, Counter, User } = createTestStore();

      const { getByTestId } = render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      const counter = getByTestId("counter");
      const counterValue = getByTestId("counter-value");
      const increaseButton = getByTestId("increase-button");
      const user = getByTestId("user");

      expect(counter).toBeInTheDocument();
      expect(counterValue).toBeInTheDocument();
      expect(user).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();

      expect(counter.contains(increaseButton)).toBe(true);
      expect(counter.contains(counterValue)).toBe(true);

      expect(counter.contains(user)).toBe(false);
      expect(user.contains(counter)).toBe(false);

      expect(counterValue).toHaveTextContent("0");

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        user: {
          name: "John",
        },
      });
    });

    test("should trigger initial render for all components exactly once", () => {
      const renderHook = vi.fn();
      const { Counter, User } = createTestStore({ renderHook });

      render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledWith("user");
      expect(renderHook).toHaveBeenCalledTimes(4);
    });

    test("should trigger re-renders for both counter and user components on counter updates", async () => {
      const renderHook = vi.fn();
      const { Counter, User } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      const increaseButton = getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledTimes(4);

      await userEvent.click(increaseButton);

      // rerenders counter value and user
      expect(renderHook).toHaveBeenCalledTimes(6);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      expect(renderHook).toHaveBeenCalledTimes(10);

      expect(getByTestId("counter-value")).toHaveTextContent("3");
    });
  });

  describe("memoized object with empty dependencies array", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const user = useMemo(
          () => ({
            name: "John",
          }),
          [],
        );

        return {
          user,
          counter,
          setCounter,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const User = () => {
        const user = useGStore(({ user }) => user);

        renderHook?.("user");

        return (
          <div data-testid="user">
            <div data-testid="usernames">{user.name}</div>
          </div>
        );
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

      return { useGStore, Counter, User };
    };

    test("should render components with initial state and verify DOM structure", () => {
      const { useGStore, Counter, User } = createTestStore();

      const { getByTestId } = render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      const counter = getByTestId("counter");
      const counterValue = getByTestId("counter-value");
      const increaseButton = getByTestId("increase-button");
      const user = getByTestId("user");

      expect(counter).toBeInTheDocument();
      expect(counterValue).toBeInTheDocument();
      expect(user).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();

      expect(counter.contains(increaseButton)).toBe(true);
      expect(counter.contains(counterValue)).toBe(true);

      expect(counter.contains(user)).toBe(false);
      expect(user.contains(counter)).toBe(false);

      expect(counterValue).toHaveTextContent("0");

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        user: {
          name: "John",
        },
      });
    });

    test("should trigger initial render for all components exactly once", () => {
      const renderHook = vi.fn();
      const { Counter, User } = createTestStore({ renderHook });

      render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledWith("user");
      expect(renderHook).toHaveBeenCalledTimes(4);
    });

    test("should only re-render counter value component on updates, keeping user component stable due to memoization", async () => {
      const renderHook = vi.fn();
      const { Counter, User } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      const increaseButton = getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledTimes(4);

      await userEvent.click(increaseButton);

      // rerenders counter value only
      expect(renderHook).toHaveBeenCalledTimes(5);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      expect(renderHook).toHaveBeenCalledTimes(7);

      expect(getByTestId("counter-value")).toHaveTextContent("3");
    });
  });

  describe("memoized object with dependency", () => {
    const createTestStore = ({
      renderHook,
    }: { renderHook?: (name: string) => void } = {}) => {
      const useGStore = createGStore(() => {
        const [counter, setCounter] = useState(0);

        const isCounterMoreThanTwo = counter > 2;

        const user = useMemo(
          () => ({
            name: "John",
          }),
          /* eslint-disable-next-line react-hooks/exhaustive-deps */
          [isCounterMoreThanTwo],
        );

        return {
          user,
          counter,
          setCounter,
        };
      });

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{String(counter)}</div>;
      };

      const User = () => {
        const user = useGStore(({ user }) => user);

        renderHook?.("user");

        return (
          <div data-testid="user">
            <div data-testid="usernames">{user.name}</div>
          </div>
        );
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

      return { useGStore, Counter, User };
    };

    test("should render components with initial state and verify DOM structure", () => {
      const { useGStore, Counter, User } = createTestStore();

      const { getByTestId } = render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      const counter = getByTestId("counter");
      const counterValue = getByTestId("counter-value");
      const increaseButton = getByTestId("increase-button");
      const user = getByTestId("user");

      expect(counter).toBeInTheDocument();
      expect(counterValue).toBeInTheDocument();
      expect(user).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();

      expect(counter.contains(increaseButton)).toBe(true);
      expect(counter.contains(counterValue)).toBe(true);

      expect(counter.contains(user)).toBe(false);
      expect(user.contains(counter)).toBe(false);

      expect(counterValue).toHaveTextContent("0");

      expect(useGStore.getState()).toEqual({
        counter: 0,
        setCounter: expect.any(Function),
        user: {
          name: "John",
        },
      });
    });

    test("should trigger initial render for all components exactly once", () => {
      const renderHook = vi.fn();
      const { Counter, User } = createTestStore({ renderHook });

      render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      expect(renderHook).toHaveBeenCalledWith("counter");
      expect(renderHook).toHaveBeenCalledWith("counter-value");
      expect(renderHook).toHaveBeenCalledWith("counter-actions");
      expect(renderHook).toHaveBeenCalledWith("user");
      expect(renderHook).toHaveBeenCalledTimes(4);
    });

    test("should re-render counter value on each update and user component only when counter exceeds threshold", async () => {
      const renderHook = vi.fn();
      const { Counter, User } = createTestStore({ renderHook });

      expect(renderHook).not.toHaveBeenCalled();

      const { getByTestId } = render(
        <div>
          <Counter />
          <User />
        </div>,
      );

      const increaseButton = getByTestId("increase-button");

      expect(renderHook).toHaveBeenCalledTimes(4);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      // rerenders counter value only
      expect(renderHook).toHaveBeenCalledTimes(6);

      await userEvent.click(increaseButton);

      // additional render - recreated user object
      expect(renderHook).toHaveBeenCalledTimes(8);

      await userEvent.click(increaseButton);
      await userEvent.click(increaseButton);

      // rerenders counter value only
      expect(renderHook).toHaveBeenCalledTimes(10);

      expect(getByTestId("counter-value")).toHaveTextContent("5");
    });
  });
});
