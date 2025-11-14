import { db } from '../firebaseConfig';
import type { User } from '../types';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const PREFERENCES_COLLECTION = 'preferences';

export const firebaseService = {
  /**
   * Fetches a user document from Firestore by sicilNo.
   */
  getUser: async (sicilNo: string): Promise<User | null> => {
    try {
      const userDocRef = doc(db, USERS_COLLECTION, sicilNo);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data() as User;
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
      const userDocRef = doc(db, USERS_COLLECTION, user.sicilNo);
      await setDoc(userDocRef, user);
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
      const userDocRef = doc(db, USERS_COLLECTION, sicilNo);
      await updateDoc(userDocRef, {
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
      const prefsDocRef = doc(db, PREFERENCES_COLLECTION, sicilNo);
      const prefsDocSnap = await getDoc(prefsDocRef);
      if (prefsDocSnap.exists()) {
        const data = prefsDocSnap.data();
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
      const prefsDocRef = doc(db, PREFERENCES_COLLECTION, sicilNo);
      await setDoc(prefsDocRef, { encryptedData });
    } catch (error) {
      console.error("Error saving preferences to Firestore:", error);
      throw error;
    }
  },
};
