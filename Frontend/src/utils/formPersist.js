/**
 * formPersist.js
 * Utility to persist form state in localStorage so data survives navigation
 * and page refresh. Uses a unique key per form to avoid collisions.
 */

export const persistForm = (key, data) => {
  try {
    const rawNew = JSON.stringify(data);
    const rawPrev = localStorage.getItem(`form_persist_${key}`);

    if (rawPrev && rawPrev !== rawNew) {
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem('global_form_history') || '[]');
      } catch (e) {}
      history.push({ key, state: rawPrev });
      if (history.length > 50) history.shift();
      localStorage.setItem('global_form_history', JSON.stringify(history));
    }

    localStorage.setItem(`form_persist_${key}`, rawNew);
  } catch (e) {
    // Storage full or unavailable
  }
};

/**
 * Restore previously persisted form state from localStorage.
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
 */
export const clearPersistedForm = (key) => {
  try {
    const rawPrev = localStorage.getItem(`form_persist_${key}`);
    if (rawPrev) {
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem('global_form_history') || '[]');
      } catch (e) {}
      history.push({ key, state: rawPrev });
      if (history.length > 50) history.shift();
      localStorage.setItem('global_form_history', JSON.stringify(history));
    }
    localStorage.removeItem(`form_persist_${key}`);
  } catch (e) {}
};

/**
 * Check if there is any global undo history available.
 */
export const hasUndoHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem('global_form_history') || '[]');
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
    let history = JSON.parse(localStorage.getItem('global_form_history') || '[]');
    if (history.length > 0) {
      const lastAction = history.pop();
      localStorage.setItem(`form_persist_${lastAction.key}`, lastAction.state);
      localStorage.setItem('global_form_history', JSON.stringify(history));
      // Dispatch event instead of reloading
      window.dispatchEvent(new Event('form_restored_event'));
    }
  } catch (e) {}
};
