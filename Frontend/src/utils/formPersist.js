/**
 * formPersist.js
 * Utility to persist form state in sessionStorage so data survives navigation
 * and page refresh. Uses a unique key per form to avoid collisions.
 */

const restoreTimestamps = {};

export const persistForm = (key, data) => {
  try {
    // If restoreForm was called very recently (e.g. within 200ms), 
    // it means the component just mounted. We ignore this persist call 
    // to prevent overwriting sessionStorage with the initial empty state.
    if (restoreTimestamps[key] && Date.now() - restoreTimestamps[key] < 200) {
      return;
    }

    const rawNew = JSON.stringify(data);
    const rawPrev = sessionStorage.getItem(`form_persist_${key}`);

    if (rawPrev && rawPrev !== rawNew) {
      let history = [];
      try {
        history = JSON.parse(sessionStorage.getItem('global_form_history') || '[]');
      } catch (e) {}
      history.push({ key, state: rawPrev });
      if (history.length > 50) history.shift();
      sessionStorage.setItem('global_form_history', JSON.stringify(history));
    }

    sessionStorage.setItem(`form_persist_${key}`, rawNew);
  } catch (e) {
    // Storage full or unavailable
  }
};

/**
 * Restore previously persisted form state from sessionStorage.
 */
export const restoreForm = (key) => {
  try {
    restoreTimestamps[key] = Date.now();
    const raw = sessionStorage.getItem(`form_persist_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Clear persisted form state (call after a successful save or clear-form).
 */
export const clearPersistedForm = (key) => {
  try {
    const rawPrev = sessionStorage.getItem(`form_persist_${key}`);
    if (rawPrev) {
      let history = [];
      try {
        history = JSON.parse(sessionStorage.getItem('global_form_history') || '[]');
      } catch (e) {}
      history.push({ key, state: rawPrev });
      if (history.length > 50) history.shift();
      sessionStorage.setItem('global_form_history', JSON.stringify(history));
    }
    sessionStorage.removeItem(`form_persist_${key}`);
  } catch (e) {}
};

/**
 * Check if there is any global undo history available.
 */
export const hasUndoHistory = () => {
  try {
    const history = JSON.parse(sessionStorage.getItem('global_form_history') || '[]');
    return history.length > 0;
  } catch (e) {
    return false;
  }
};

/**
 * Perform a global undo by popping the last saved form state and reloading the page.
 */
export const performGlobalUndo = () => {
  try {
    let history = JSON.parse(sessionStorage.getItem('global_form_history') || '[]');
    if (history.length > 0) {
      const lastAction = history.pop();
      sessionStorage.setItem(`form_persist_${lastAction.key}`, lastAction.state);
      sessionStorage.setItem('global_form_history', JSON.stringify(history));
      // Dispatch event instead of reloading
      window.dispatchEvent(new Event('form_restored_event'));
    }
  } catch (e) {}
};
