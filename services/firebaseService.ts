import { db } from '../firebaseConfig';
import type { User } from '../types';

const USERS_COLLECTION = 'users';
const PREFERENCES_COLLECTION = 'preferences';

export const firebaseService = {
  /**
   * Fetches a user document from Firestore by sicilNo.
   */
  getUser: async (sicilNo: string): Promise<User | null> => {
    try {
      const userDoc = await db.collection(USERS_COLLECTION).doc(sicilNo).get();
      if (userDoc.exists) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error("Error getting user from Firestore:", error);
      throw error;
    }
  },

  /**
   * Creates a new user document in Firestore.
   */
  createUser: async (user: User): Promise<void> => {
    try {
      await db.collection(USERS_COLLECTION).doc(user.sicilNo).set(user);
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
      throw error;
    }
  },

  /**
   * Updates a user's password hash in Firestore.
   */
  updateUserPassword: async (sicilNo: string, newPasswordHash: string): Promise<void> => {
    try {
      await db.collection(USERS_COLLECTION).doc(sicilNo).update({
        passwordHash: newPasswordHash
      });
    } catch (error) {
      console.error("Error updating user password in Firestore:", error);
      throw error;
    }
  },

  /**
   * Fetches the encrypted preferences for a user from Firestore.
   */
  getPreferences: async (sicilNo: string): Promise<string | null> => {
    try {
      const prefsDoc = await db.collection(PREFERENCES_COLLECTION).doc(sicilNo).get();
      if (prefsDoc.exists) {
        const data = prefsDoc.data();
        return data?.encryptedData || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting preferences from Firestore:", error);
      throw error;
    }
  },
  
  /**
   * Saves the encrypted preferences for a user to Firestore.
   */
  savePreferences: async (sicilNo: string, encryptedData: string): Promise<void> => {
    try {
      await db.collection(PREFERENCES_COLLECTION).doc(sicilNo).set({ encryptedData });
    } catch (error) {
      console.error("Error saving preferences to Firestore:", error);
      throw error;
    }
  },
};