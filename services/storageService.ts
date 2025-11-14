import type { User } from '../types';

const USERS_KEY = 'TYS_users';
const PREFERENCES_KEY = 'TYS_preferences';

// Helper functions to interact with localStorage
const getUsersFromStorage = (): Record<string, User> => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
  } catch (e) {
    console.error("Failed to parse users from localStorage", e);
    return {};
  }
};

const saveUsersToStorage = (users: Record<string, User>): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getPreferencesFromStorage = (): Record<string, string> => {
  try {
    const prefsJson = localStorage.getItem(PREFERENCES_KEY);
    return prefsJson ? JSON.parse(prefsJson) : {};
  } catch (e) {
    console.error("Failed to parse preferences from localStorage", e);
    return {};
  }
};

const savePreferencesToStorage = (prefs: Record<string, string>): void => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
};


export const storageService = {
  /**
   * Fetches a user object from localStorage by sicilNo.
   */
  getUser: async (sicilNo: string): Promise<User | null> => {
    const users = getUsersFromStorage();
    return users[sicilNo] || null;
  },

  /**
   * Creates a new user in localStorage.
   */
  createUser: async (user: User): Promise<void> => {
    const users = getUsersFromStorage();
    users[user.sicilNo] = user;
    saveUsersToStorage(users);
  },

  /**
   * Updates a user's password hash in localStorage.
   */
  updateUserPassword: async (sicilNo: string, newPasswordHash: string): Promise<void> => {
    const users = getUsersFromStorage();
    if (users[sicilNo]) {
      users[sicilNo].passwordHash = newPasswordHash;
      saveUsersToStorage(users);
    }
  },

  /**
   * Fetches the encrypted preferences for a user from localStorage.
   */
  getPreferences: async (sicilNo: string): Promise<string | null> => {
    const allPrefs = getPreferencesFromStorage();
    return allPrefs[sicilNo] || null;
  },
  
  /**
   * Saves the encrypted preferences for a user to localStorage.
   */
  savePreferences: async (sicilNo: string, encryptedData: string): Promise<void> => {
    const allPrefs = getPreferencesFromStorage();
    allPrefs[sicilNo] = encryptedData;
    savePreferencesToStorage(allPrefs);
  },
};
