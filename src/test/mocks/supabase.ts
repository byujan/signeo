import { vi } from "vitest";

/** Creates a chainable mock that mimics the Supabase query builder. */
export function createChainableMock(resolvedValue: { data: unknown; error: unknown } = { data: null, error: null }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  const chain = new Proxy(mock, {
    get(_target, prop) {
      if (prop === "then") return undefined; // not thenable
      if (!mock[prop as string]) {
        mock[prop as string] = vi.fn().mockReturnValue(chain);
      }
      return mock[prop as string];
    },
  });

  // Make .single() resolve the value
  mock.single = vi.fn().mockResolvedValue(resolvedValue);

  return chain as Record<string, ReturnType<typeof vi.fn>>;
}

/** Sets up the standard typed-admin mocks. Call vi.mock before using. */
export function mockTypedAdmin() {
  const mocks = {
    admin: vi.fn(),
    adminInsert: vi.fn(),
    adminSelectOne: vi.fn(),
    adminSelectMany: vi.fn(),
  };
  return mocks;
}
