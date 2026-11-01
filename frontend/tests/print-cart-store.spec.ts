import { expect, test } from '@playwright/test';

const STORE_PATH = '../src/screens/App/screens/PrintCart/stores/PrintCartStore';
type StoreModule =
  typeof import('../src/screens/App/screens/PrintCart/stores/PrintCartStore');

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 10);

const item = {
  photoIdentifier: 'photo-1',
  variant: 'print-hpr-8x12',
  colorize: false,
  quantity: 2,
} as never as import('../src/screens/App/screens/PrintCart/stores/PrintCartStore').CartItem;

function fakeLocalStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  } as Storage;
}

function install(storage: Storage | (() => never)): void {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: typeof storage === 'function' ? storage : () => storage,
  });
}

type Store = StoreModule['default'];

// The spec is compiled to CommonJS, which can wrap the module's default export once more.
async function loadStore(
  storage: Parameters<typeof install>[0] = fakeLocalStorage()
): Promise<StoreModule & { store: Store }> {
  const mod = (await import(STORE_PATH)) as StoreModule;
  const store =
    (mod.default as unknown as { default?: Store }).default ?? mod.default;
  install(fakeLocalStorage());
  store.setState({ items: [], savedAt: 0 });
  install(storage);
  await store.persist.rehydrate();
  return { ...mod, store };
}

function persisted(
  mod: StoreModule,
  storage: Storage
): { items: unknown[]; savedAt: number } {
  const raw = storage.getItem(mod.CART_STORAGE_KEY);
  return (JSON.parse(raw as string) as { state: never }).state;
}

test.beforeEach(() => {
  Date.now = () => NOW;
});

test('adding merges identical lines and saves to localStorage', async () => {
  const storage = fakeLocalStorage();
  const mod = await loadStore(storage);
  const { store } = mod;
  expect(store.getState().addItem(item)).toBe(true);
  expect(store.getState().addItem(item)).toBe(true);
  store.getState().addItem({ ...item, colorize: true });

  expect(store.getState().items).toHaveLength(2);
  expect(store.getState().items[0].quantity).toBe(4);
  expect(persisted(mod, storage).items).toHaveLength(2);
  expect(persisted(mod, storage).savedAt).toBe(NOW);
});

test('refuses to merge past the per-line quantity limit', async () => {
  const { store, MAX_ITEM_QUANTITY } = await loadStore();

  expect(store.getState().addItem({ ...item, quantity: 8 })).toBe(true);
  expect(store.getState().addItem({ ...item, quantity: 3 })).toBe(false);
  expect(store.getState().items[0].quantity).toBe(8);
  expect(store.getState().addItem({ ...item, quantity: 2 })).toBe(true);
  expect(store.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
});

test('quantity is capped and removing drops the line', async () => {
  const { store, MAX_ITEM_QUANTITY } = await loadStore();

  store.getState().addItem(item);
  store.getState().setQuantity(item, 99);
  expect(store.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  store.getState().setQuantity(item, 0);
  expect(store.getState().items[0].quantity).toBe(1);

  store.getState().removeItem(item);
  expect(store.getState().items).toEqual([]);
});

test('refuses a new line when the cart is full', async () => {
  const { store, MAX_CART_ITEMS } = await loadStore();

  for (let i = 0; i < MAX_CART_ITEMS; i++) {
    expect(
      store.getState().addItem({ ...item, photoIdentifier: `photo-${i}` })
    ).toBe(true);
  }
  expect(store.getState().addItem({ ...item, photoIdentifier: 'extra' })).toBe(
    false
  );
  expect(
    store.getState().addItem({ ...item, photoIdentifier: 'photo-0' })
  ).toBe(true);
});

test('restores a cart saved within the last 7 days', async () => {
  const savedAt = NOW - 6 * DAY_MS;
  const { store } = await loadStore(
    fakeLocalStorage({
      'print-cart': JSON.stringify({
        state: { items: [item], savedAt },
        version: 0,
      }),
    })
  );
  expect(store.getState().items).toEqual([item]);
});

test('drops a cart older than 7 days', async () => {
  const { store } = await loadStore(
    fakeLocalStorage({
      'print-cart': JSON.stringify({
        state: { items: [item], savedAt: NOW - 8 * DAY_MS },
        version: 0,
      }),
    })
  );
  expect(store.getState().items).toEqual([]);
});

test('ignores corrupt stored data', async () => {
  for (const raw of [
    'not json',
    JSON.stringify({ state: { items: 'nope', savedAt: NOW }, version: 0 }),
    JSON.stringify({
      state: { items: [{ photoIdentifier: 1 }], savedAt: NOW },
      version: 0,
    }),
  ]) {
    const { store } = await loadStore(fakeLocalStorage({ 'print-cart': raw }));
    expect(store.getState().items).toEqual([]);
  }
});

test('keeps working in memory when localStorage is unavailable or throws', async () => {
  const { store } = await loadStore(() => {
    throw new Error('SecurityError');
  });
  expect(store.getState().addItem(item)).toBe(true);
  expect(store.getState().items).toHaveLength(1);

  install({
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => undefined,
  } as unknown as Storage);
  expect(store.getState().addItem({ ...item, colorize: true })).toBe(true);
  expect(store.getState().items).toHaveLength(2);
});
