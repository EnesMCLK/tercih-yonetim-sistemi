import type { User } from '../types';
import { firebaseService } from './firebaseService';

// This service now acts as a facade, delegating all storage operations to firebaseService.
// This decouples the application components from the specific data storage implementation (Firebase),
// allowing for easier maintenance and testing.
export const storageService = {
  /**
   * Fetches a user object from Firestore by sicilNo.
   */
  getUser: async (sicilNo: string): Promise<User | null> => {
    return firebaseService.getUser(sicilNo);
  },

  /**
   * Creates a new user in Firestore.
   */
  createUser: async (user: User): Promise<void> => {
    return firebaseService.createUser(user);
  },

  /**
   * Updates a user's password hash in Firestore.
   */
  updateUserPassword: async (sicilNo: string, newPasswordHash: string): Promise<void> => {
    return firebaseService.updateUserPassword(sicilNo, newPasswordHash);
  },

  /**
   * Fetches the encrypted preferences for a user from Firestore.
   */
  getPreferences: async (sicilNo: string): Promise<string | null> => {
    return firebaseService.getPreferences(sicilNo);
  },
  
  /**
   * Saves the encrypted preferences for a user to Firestore.
   */
  savePreferences: async (sicilNo: string, encryptedData: string): Promise<void> => {
    return firebaseService.savePreferences(sicilNo, encryptedData);
  },
};