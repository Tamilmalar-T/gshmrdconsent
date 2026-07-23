/**
 * formPersist.js
 * Utility to persist form state in localStorage so data survives navigation
 * and page refresh. Uses a unique key per form to avoid collisions.
 */

/**
 * Save form state to localStorage.
 * @param {string} key  - Unique key identifying the form (e.g. 'consent_general_admission')
 * @param {*}      data - Any JSON-serialisable value (object, array, etc.)
 */
export const persistForm = (key, data) => {
  try {
    localStorage.setItem(`form_persist_${key}`, JSON.stringify(data));
  } catch (e) {
    // Storage full or unavailable — fail silently
  }
};

/**
 * Restore previously persisted form state from localStorage.
 * Returns null if nothing was saved.
 * @param {string} key
 * @returns {*|null}
 */
export const restoreForm = (key) => {
  try {
    const raw = localStorage.getItem(`form_persist_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Clear persisted form state (call after a successful save or clear-form).
 * @param {string} key
 */
export const clearPersistedForm = (key) => {
  try {
    localStorage.removeItem(`form_persist_${key}`);
  } catch (e) {}
};
