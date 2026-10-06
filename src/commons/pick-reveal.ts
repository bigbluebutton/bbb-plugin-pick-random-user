import { useMemo, useSyncExternalStore } from 'react';
import { DataChannelEntryResponseType } from 'bigbluebutton-html-plugin-sdk';
import { PickedUser } from '../components/pick-random-user/types';

// A pick this presenter just made, from the click until their own reel stops on it. Until
// then the panel behind the modal leaves it out of its lists, or the presenter would read
// the result there while the reel still spins. The panel and the modal render in separate
// React roots, hence a module-level store rather than state or context.
interface PendingReveal {
  userId: string;
  // Entries already in the data channel at the click, so an earlier pick of the same user
  // stays visible: only the entry the click produces is held back.
  knownEntryIds: Set<string>;
}

// In case the reel never reports (the pick was rejected, the modal did not open), the pick
// shows up in the panel after this anyway.
export const REVEAL_TIMEOUT_MS = 10000;

let pending: PendingReveal | null = null;
let timeout: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/** Shows the pick that was being held back, once the presenter's reel has stopped on it. */
export const finishPickReveal = () => {
  clearTimeout(timeout);
  if (!pending) return;
  pending = null;
  notify();
};

/**
 * Holds back the pick about to be published, until finishPickReveal. Called right before
 * the pick is pushed, so the panel never renders it ahead of the reel.
 * @param userId the user being picked
 * @param knownEntryIds entries already in the data channel, which stay visible
 */
export const startPickReveal = (userId: string, knownEntryIds: string[]) => {
  clearTimeout(timeout);
  pending = { userId, knownEntryIds: new Set(knownEntryIds) };
  timeout = setTimeout(finishPickReveal, REVEAL_TIMEOUT_MS);
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getPending = () => pending;

/**
 * The picks this presenter may already see: the data channel entries minus the one still
 * being revealed to them by the reel.
 * @param entries the pickRandomUser data channel entries
 * @returns the entries to show, in the same order
 */
export const useRevealedPicks = (
  entries: DataChannelEntryResponseType<PickedUser>[] | undefined,
) => {
  const current = useSyncExternalStore(subscribe, getPending);
  return useMemo(() => {
    if (!current || !entries) return entries;
    return entries.filter((entry) => entry.payloadJson?.userId !== current.userId
      || current.knownEntryIds.has(entry.entryId));
  }, [entries, current]);
};
