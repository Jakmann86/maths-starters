// src/curriculum/topicPool.js
//
// Pool-selection model for the board (replaces the ticked-history/recency
// model in topicHistory.js — retired). The teacher picks a SET of topics —
// the pool — and each of the four boxes draws a topic at random from it.
// No calendar/date logic, no per-box recency: every "New four" is an
// independent random draw from the current pool.

import _ from 'lodash';

const STORAGE_KEY = 'maths-starters:topic-pool';

/** Loads the selected topic pool. Returns [] if empty, missing, or unavailable. */
export const loadPool = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Persists the selected topic pool. A no-op if localStorage is unavailable. */
export const savePool = (pool) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
  } catch {
    // storage unavailable (private mode, quota, non-browser) — the pool
    // just won't survive a refresh this session
  }
};

/**
 * Adds `topicName` to `pool` if absent, removes it if present. Does not
 * mutate `pool`.
 */
export const togglePool = (pool, topicName) => (
  pool.includes(topicName) ? pool.filter((t) => t !== topicName) : [...pool, topicName]
);

/**
 * Draws 4 topic names for boxes 0..3, at random, from `pool` — falling back
 * to `allTopics` when the pool is empty so the board is never blank. No
 * repeats when the draw pool has >=4 topics; repeats allowed below that. One
 * behaviour regardless of pool size — no special-casing "exactly 4".
 */
export const drawBoxTopics = (pool, allTopics) => {
  const base = pool.length > 0 ? pool : allTopics;
  if (base.length >= 4) return _.sampleSize(base, 4);
  return Array.from({ length: 4 }, () => _.sample(base));
};

/**
 * Picks a new topic for one box's "swap topic" action, from `pool` (falling
 * back to `allTopics` when the pool is empty, same as drawBoxTopics). Prefers
 * a topic not already shown in `otherTopics` (the other boxes' current
 * topics), allowing a repeat only if the draw pool is too small to avoid
 * one. Never returns `currentTopic` unless the effective pool has nothing
 * else to offer, in which case swapping is a no-op rather than an error.
 */
export const pickSwapTopic = (pool, allTopics, currentTopic, otherTopics) => {
  const base = pool.length > 0 ? pool : allTopics;
  const distinct = [...new Set(base)];
  if (distinct.length <= 1) return distinct[0] ?? currentTopic;

  const notCurrent = distinct.filter((t) => t !== currentTopic);
  const fresh = notCurrent.filter((t) => !otherTopics.includes(t));
  return _.sample(fresh.length > 0 ? fresh : notCurrent);
};
