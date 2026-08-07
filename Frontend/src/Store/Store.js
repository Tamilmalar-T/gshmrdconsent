import { configureStore, createSlice } from '@reduxjs/toolkit';

// Create a basic slice for managing global state
const databaseSlice = createSlice({
  name: 'database',
  initialState: {
    records: [],
    drafts: []
  },
  reducers: {
    setRecords: (state, action) => {
      state.records = action.payload;
    },
    setDrafts: (state, action) => {
      state.drafts = action.payload;
    }
  }
});

export const { setRecords, setDrafts } = databaseSlice.actions;

// 1. Load initial state from Local Storage if it exists
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('redux_store');
    if (serializedState === null) {
      return undefined; // Let reducers initialize state
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from local storage", err);
    return undefined;
  }
};

// Configure the Redux Store
const store = configureStore({
  reducer: {
    database: databaseSlice.reducer,
  },
  preloadedState: loadState()
});

// Utility to log local storage usage
const logLocalStorageUsage = () => {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const item = localStorage.getItem(key);
      if (item) {
        total += item.length;
      }
    }
    console.log("Local Storage Used:", (total / 1024).toFixed(2), "KB");
  } catch (err) {
    // Ignore errors in environments without localStorage
  }
};

// Run it immediately on page load so you can see it!
logLocalStorageUsage();

// 2. Subscribe to store changes and save them to Local Storage automatically
store.subscribe(() => {
  try {
    // We get the current state of Redux
    const state = store.getState();
    // Convert it to a string and save it to the Local Storage!
    const serializedState = JSON.stringify(state);
    localStorage.setItem('redux_store', serializedState);

    // Calculate and log total localStorage usage whenever state changes
    logLocalStorageUsage();

  } catch (err) {
    console.error("Could not save state to local storage", err);
  }
});

export default store;
