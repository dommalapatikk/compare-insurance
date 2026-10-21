export const JOURNEY_TOMBSTONES_KEY = "compare-insurance:journey-tombstones";
export const JOURNEY_ROOT_HISTORY_RETURN_KEY = "compare-insurance:journey-root-history-return";

const SAFE_JOURNEY_ID = /^[A-Za-z0-9_-]{16,64}$/;

export type JourneyHistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type TombstoneSnapshot = {
  readonly version: 1;
  readonly ids: readonly string[];
};

export function isSafeJourneyId(value: unknown): value is string {
  return typeof value === "string" && SAFE_JOURNEY_ID.test(value);
}

export function createJourneyId(
  randomUuid: () => string = () => crypto.randomUUID(),
): string {
  const id = randomUuid().replaceAll("-", "");
  if (!isSafeJourneyId(id)) throw new Error("Could not create a safe journey id.");
  return id;
}

function readTombstones(storage: JourneyHistoryStorage): string[] {
  try {
    const raw = storage.getItem(JOURNEY_TOMBSTONES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<TombstoneSnapshot>;
    if (parsed.version !== 1 || !Array.isArray(parsed.ids)) return [];
    return parsed.ids.filter(isSafeJourneyId);
  } catch {
    return [];
  }
}

export function tombstoneJourney(
  storage: JourneyHistoryStorage,
  journeyId: string | null,
): void {
  if (!isSafeJourneyId(journeyId)) return;
  const ids = readTombstones(storage).filter((id) => id !== journeyId);
  ids.push(journeyId);
  storage.setItem(JOURNEY_TOMBSTONES_KEY, JSON.stringify({
    version: 1,
    ids,
  } satisfies TombstoneSnapshot));
}

export function isJourneyRestorable(
  storage: JourneyHistoryStorage,
  journeyId: string,
): boolean {
  return isSafeJourneyId(journeyId) && !readTombstones(storage).includes(journeyId);
}

export function markJourneyRootHistoryReturn(storage: JourneyHistoryStorage): void {
  storage.setItem(JOURNEY_ROOT_HISTORY_RETURN_KEY, "1");
}

export function consumeJourneyRootHistoryReturn(storage: JourneyHistoryStorage): boolean {
  const marked = storage.getItem(JOURNEY_ROOT_HISTORY_RETURN_KEY) === "1";
  storage.removeItem(JOURNEY_ROOT_HISTORY_RETURN_KEY);
  return marked;
}
