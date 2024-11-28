// src/services/userService.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserSocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

interface UserProfile extends UserSocialLinks {
  displayName: string;
  photoURL?: string;
  email: string;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },

  async setUserProfile(userId: string, profileData: UserProfile) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in setUserProfile:', error);
      throw error;
    }
  }
};