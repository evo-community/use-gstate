import { useLayoutEffect, useState } from "react";
import "@testing-library/jest-dom";
import { describe, expect, vi, test } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { createGStore } from "../index";

const increaseStateAction = (prevCounter: number) => prevCounter + 1;

const nextMicrotask = () => Promise.resolve();

const nextTask = () => new Promise((resolve) => setTimeout(resolve));

describe("useLayoutEffect in useGStore", () => {
  describe("useLayoutEffect with dependencies", () => {
    const createTestComponents = ({
      renderHook,
      effectHook,
      effectCleanupHook,
      initialize,
      destroy,
    }: {
      renderHook?: (name: string) => void;
      effectHook?: (value: unknown) => void;
      effectCleanupHook?: (value: unknown) => void;
      initialize?: "eager";
      destroy?: "on-all-unsubscribed";
    } = {}) => {
      const useGStore = createGStore(
        () => {
          const [counter, setCounter] = useState(0);

          const [user, setUser] = useState<{ name: string } | null | undefined>(
            {
              name: "John",
            },
          );

          useLayoutEffect(() => {
            effectHook?.(counter);

            return () => {
              effectCleanupHook?.(counter);
            };
          }, [counter]);

          return {
            counter,
            setCounter,
            user,
            setUser,
          };
        },
        {
          initialize,
          destroy,
        },
      );

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{counter}</div>;
      };

      const CounterActions = () => {
        const setCounter = useGStore(({ setCounter }) => setCounter);

        const increase = () => setCounter(increaseStateAction);

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

      const UserActions = () => {
        const setUser = useGStore(({ setUser }) => setUser);

        const resetUsername = () => setUser({ name: "" });
        const setUserNull = () => setUser(null);
        const setUserUndefined = () => setUser(undefined);

        renderHook?.("user-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="reset-username-button"
              onClick={resetUsername}
            >
              Reset username
            </button>
            <button
              typeof="button"
              data-testid="set-user-null-button"
              onClick={setUserNull}
            >
              Set user "null"
            </button>
            <button
              typeof="button"
              data-testid="set-user-undefined-button"
              onClick={setUserUndefined}
            >
              Set user "undefined"
            </button>
          </div>
        );
      };

      const UserName = () => {
        const username = useGStore(({ user }) => user?.name);

        renderHook?.("username");

        return <div data-testid="username">{username}</div>;
      };

      const User = () => {
        renderHook?.("user");

        return (
          <div data-testid="user">
            <UserName />
            <UserActions />
          </div>
        );
      };

      return {
        User,
        Counter,
        useGStore,
      };
    };

    describe("Initial rendering behavior", () => {
      test("should run effect once after component mount with default initialization", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      test("should run effect once after component mount with eager initialization", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
          initialize: "eager",
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });
    });

    describe("Component unmount behavior", () => {
      test("should not run effect cleanup when all components unmount with default destroy behavior", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        const { unmount } = render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        unmount();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      test("should run effect cleanup when all components unmount with on-all-unsubscribed destroy behavior", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
          destroy: "on-all-unsubscribed",
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        const { unmount } = render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        unmount();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).toHaveBeenCalledWith(0);

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectHook).toHaveBeenCalledWith(0);
        expect(effectCleanupHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).toHaveBeenCalledWith(0);
      });
    });

    describe("State update behavior", () => {
      test("should run effect and cleanup when dependencies change via component interaction", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        const increaseCounterButton = screen.getByTestId("increase-button");

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledTimes(1);
        expect(effectHook).toHaveBeenLastCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await userEvent.click(increaseCounterButton);

        await nextMicrotask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(1);
        expect(effectCleanupHook).toHaveBeenLastCalledWith(0);

        expect(effectHook).toHaveBeenCalledTimes(2);
        expect(effectHook).toHaveBeenLastCalledWith(1);

        await nextMicrotask();

        await userEvent.click(increaseCounterButton);
        await userEvent.click(increaseCounterButton);

        await nextMicrotask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(3);
        expect(effectCleanupHook).toHaveBeenLastCalledWith(2);

        expect(effectHook).toHaveBeenCalledTimes(4);
        expect(effectHook).toHaveBeenLastCalledWith(3);
      });

      test("should run effect and cleanup when dependencies change via direct state update", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User, useGStore } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledTimes(1);
        expect(effectHook).toHaveBeenLastCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        await act(async () =>
          useGStore.getState().setCounter(increaseStateAction),
        );

        await nextMicrotask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(1);
        expect(effectCleanupHook).toHaveBeenLastCalledWith(0);

        expect(effectHook).toHaveBeenCalledTimes(2);
        expect(effectHook).toHaveBeenLastCalledWith(1);

        await nextMicrotask();

        await act(async () =>
          useGStore.getState().setCounter(increaseStateAction),
        );
        await act(async () =>
          useGStore.getState().setCounter(increaseStateAction),
        );

        await nextMicrotask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(3);
        expect(effectCleanupHook).toHaveBeenLastCalledWith(2);

        expect(effectHook).toHaveBeenCalledTimes(4);
        expect(effectHook).toHaveBeenLastCalledWith(3);
      });
    });

    describe("State update without dependency changes", () => {
      test("should not run effect or cleanup when state updates without dependency changes", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        const resetUserNameButton = screen.getByTestId("reset-username-button");
        const userNameComponent = screen.getByTestId("username");

        expect(resetUserNameButton).toBeInTheDocument();
        expect(userNameComponent).toBeInTheDocument();
        expect(userNameComponent).toHaveTextContent("John");

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledTimes(1);
        expect(effectHook).toHaveBeenLastCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        await userEvent.click(resetUserNameButton);

        await nextMicrotask();

        expect(userNameComponent).toHaveTextContent("");

        expect(effectHook).toHaveBeenCalledTimes(1);
        expect(effectHook).toHaveBeenLastCalledWith(0);
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      describe.skip("Handling nullish state updates", () => {
        test("should not trigger effect or cleanup when setting state to null if the effect's dependencies remain unchanged", async () => {
          const effectHook = vi.fn();
          const effectCleanupHook = vi.fn();
          const { Counter, User } = createTestComponents({
            effectHook,
            effectCleanupHook,
          });

          expect(effectHook).not.toHaveBeenCalled();
          expect(effectCleanupHook).not.toHaveBeenCalled();

          render(
            <div>
              <Counter />
              <User />
            </div>,
          );

          const setUserNullButton = screen.getByTestId("set-user-null-button");
          const userNameComponent = screen.getByTestId("username");

          expect(setUserNullButton).toBeInTheDocument();
          expect(userNameComponent).toBeInTheDocument();
          expect(userNameComponent).toHaveTextContent("John");

          expect(effectHook).not.toHaveBeenCalled();
          expect(effectCleanupHook).not.toHaveBeenCalled();

          await nextTask();

          expect(effectHook).toHaveBeenCalledTimes(1);
          expect(effectHook).toHaveBeenLastCalledWith(0);
          expect(effectCleanupHook).not.toHaveBeenCalled();

          await nextTask();

          await userEvent.click(setUserNullButton);

          await nextTask();

          expect(userNameComponent).toHaveTextContent("");

          expect(effectHook).toHaveBeenCalledTimes(1);
          expect(effectHook).toHaveBeenLastCalledWith(0);
          expect(effectCleanupHook).not.toHaveBeenCalled();
        });

        test("should not trigger effect or cleanup when setting state to undefined if the effect's dependencies remain unchanged", async () => {
          const effectHook = vi.fn();
          const effectCleanupHook = vi.fn();
          const { Counter, User } = createTestComponents({
            effectHook,
            effectCleanupHook,
          });

          expect(effectHook).not.toHaveBeenCalled();
          expect(effectCleanupHook).not.toHaveBeenCalled();

          render(
            <div>
              <Counter />
              <User />
            </div>,
          );

          const setUserUndefinedButton = screen.getByTestId(
            "set-user-undefined-button",
          );
          const userNameComponent = screen.getByTestId("username");

          expect(setUserUndefinedButton).toBeInTheDocument();
          expect(userNameComponent).toBeInTheDocument();
          expect(userNameComponent).toHaveTextContent("John");

          expect(effectHook).not.toHaveBeenCalled();
          expect(effectCleanupHook).not.toHaveBeenCalled();

          await nextTask();

          expect(effectHook).toHaveBeenCalledTimes(1);
          expect(effectHook).toHaveBeenLastCalledWith(0);
          expect(effectCleanupHook).not.toHaveBeenCalled();

          await nextTask();

          await userEvent.click(setUserUndefinedButton);

          await nextTask();

          expect(userNameComponent).toHaveTextContent("");

          expect(effectHook).toHaveBeenCalledTimes(1);
          expect(effectHook).toHaveBeenLastCalledWith(0);
          expect(effectCleanupHook).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("useLayoutEffect with empty dependencies array", () => {
    const createTestComponents = ({
      renderHook,
      effectHook,
      effectCleanupHook,
      initialize,
      destroy,
    }: {
      renderHook?: (name: string) => void;
      effectHook?: () => void;
      effectCleanupHook?: () => void;
      initialize?: "eager" | "lazy";
      destroy?: "on-all-unsubscribed";
    } = {}) => {
      const useGStore = createGStore(
        () => {
          const [counter, setCounter] = useState(0);

          const [user, setUser] = useState<{ name: string } | null | undefined>(
            {
              name: "John",
            },
          );

          useLayoutEffect(() => {
            effectHook?.();

            return () => {
              effectCleanupHook?.();
            };
          }, []);

          return {
            counter,
            setCounter,
            user,
            setUser,
          };
        },
        {
          initialize,
          destroy,
        },
      );

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{counter}</div>;
      };

      const CounterActions = () => {
        const setCounter = useGStore(({ setCounter }) => setCounter);

        const increase = () => setCounter(increaseStateAction);

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

      const UserActions = () => {
        const setUser = useGStore(({ setUser }) => setUser);

        const resetUserName = () => setUser({ name: "" });

        renderHook?.("user-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="reset-username-button"
              onClick={resetUserName}
            >
              Reset username
            </button>
          </div>
        );
      };

      const UserName = () => {
        const username = useGStore(({ user }) => user?.name);

        renderHook?.("username");

        return <div data-testid="username">{username}</div>;
      };

      const User = () => {
        renderHook?.("user");

        return (
          <div data-testid="user">
            <UserName />
            <UserActions />
          </div>
        );
      };

      return {
        User,
        Counter,
        useGStore,
      };
    };

    describe("Initial rendering behavior", () => {
      test("should run effect once after component mount with default initialization", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      test("should run effect once after component mount with eager initialization", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
          initialize: "eager",
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });
    });

    describe("Component unmount behavior", () => {
      test("should not run effect cleanup when all components unmount with default destroy behavior", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        const { unmount } = render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        unmount();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      test("should run effect cleanup when all components unmount with on-all-unsubscribed destroy behavior", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
          destroy: "on-all-unsubscribed",
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        const { unmount } = render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        unmount();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).toHaveBeenCalledOnce();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).toHaveBeenCalledOnce();
      });
    });
  });

  describe("useLayoutEffect without dependencies array", () => {
    const createTestComponents = ({
      renderHook,
      effectHook,
      effectCleanupHook,
      initialize,
      destroy,
    }: {
      renderHook?: (name: string) => void;
      effectHook?: () => void;
      effectCleanupHook?: () => void;
      initialize?: "eager" | "lazy";
      destroy?: "on-all-unsubscribed";
    } = {}) => {
      const useGStore = createGStore(
        () => {
          const [counter, setCounter] = useState(0);

          const [user, setUser] = useState<{ name: string } | null | undefined>(
            {
              name: "John",
            },
          );

          useLayoutEffect(() => {
            effectHook?.();

            return () => {
              effectCleanupHook?.();
            };
          });

          return {
            counter,
            setCounter,
            user,
            setUser,
          };
        },
        {
          initialize,
          destroy,
        },
      );

      const CounterValue = () => {
        const counter = useGStore(({ counter }) => counter);

        renderHook?.("counter-value");

        return <div data-testid="counter-value">{counter}</div>;
      };

      const CounterActions = () => {
        const setCounter = useGStore(({ setCounter }) => setCounter);

        const increase = () => setCounter(increaseStateAction);

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
            <CounterValue />
            <CounterActions />
          </div>
        );
      };

      const UserActions = () => {
        const setUser = useGStore(({ setUser }) => setUser);

        const resetUserName = () => setUser({ name: "" });

        renderHook?.("user-actions");

        return (
          <div>
            <button
              typeof="button"
              data-testid="reset-user-button"
              onClick={resetUserName}
            >
              Reset username
            </button>
          </div>
        );
      };

      const UserName = () => {
        const username = useGStore(({ user }) => user?.name);

        renderHook?.("username");

        return <div data-testid="username">{username}</div>;
      };

      const User = () => {
        renderHook?.("user");

        return (
          <div data-testid="user">
            <UserName />
            <UserActions />
          </div>
        );
      };

      return {
        User,
        Counter,
        useGStore,
      };
    };

    describe("Initial rendering behavior", () => {
      test("should run effect once after component mount with default initialization", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      test("should run effect once after component mount with eager initialization", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
          initialize: "eager",
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });
    });

    describe("Component unmount behavior", () => {
      test("should not run effect cleanup when all components unmount with default destroy behavior", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        const { unmount } = render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        unmount();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).not.toHaveBeenCalled();
      });

      test("should run effect cleanup when all components unmount with on-all-unsubscribed destroy behavior", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
          destroy: "on-all-unsubscribed",
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        const { unmount } = render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextMicrotask();

        unmount();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).toHaveBeenCalledOnce();

        await nextTask();

        expect(effectHook).toHaveBeenCalledOnce();
        expect(effectCleanupHook).toHaveBeenCalledOnce();
      });
    });

    describe.skip("State update behavior", () => {
      test("should run effect and cleanup on every state update via component interaction", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        const increaseCounterButton = screen.getByTestId("increase-button");

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledTimes(1);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await userEvent.click(increaseCounterButton);

        await nextTask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(1);
        expect(effectHook).toHaveBeenCalledTimes(2);

        await nextTask();

        await userEvent.click(increaseCounterButton);
        await userEvent.click(increaseCounterButton);

        await nextTask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(3);
        expect(effectHook).toHaveBeenCalledTimes(4);
      });

      test("should run effect and cleanup on every state update via direct state update", async () => {
        const effectHook = vi.fn();
        const effectCleanupHook = vi.fn();
        const { Counter, User, useGStore } = createTestComponents({
          effectHook,
          effectCleanupHook,
        });

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        render(
          <div>
            <Counter />
            <User />
          </div>,
        );

        expect(effectHook).not.toHaveBeenCalled();
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        expect(effectHook).toHaveBeenCalledTimes(1);
        expect(effectCleanupHook).not.toHaveBeenCalled();

        await nextTask();

        await act(async () =>
          useGStore.getState().setCounter(increaseStateAction),
        );

        await nextTask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(1);
        expect(effectHook).toHaveBeenCalledTimes(2);

        await nextTask();

        await act(async () =>
          useGStore.getState().setCounter(increaseStateAction),
        );
        await act(async () =>
          useGStore.getState().setCounter(increaseStateAction),
        );

        await nextTask();

        expect(effectCleanupHook).toHaveBeenCalledTimes(3);
        expect(effectHook).toHaveBeenCalledTimes(4);
      });
    });
  });
});
