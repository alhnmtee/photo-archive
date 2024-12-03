// src/services/userService.ts
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserSocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

interface UserProfile extends UserSocialLinks {
  id: string;
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
        return {
          id: userDoc.id,
          ...userDoc.data() as Omit<UserProfile, 'id'>
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const userDocs = await getDocs(usersRef);
      
      const users = userDocs.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<UserProfile, 'id'>
        }))
        .filter(user => user.displayName && user.email); // Sadece gerekli alanları olan kullanıcıları filtrele

      console.log('Fetched users:', users); // Debug için
      return users;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  },

  async setUserProfile(userId: string, profileData: Omit<UserProfile, 'id'>) {
    try {
      const userRef = doc(db, 'users', userId);
      // Auth'dan gelen bilgileri kaydet
      await setDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error in setUserProfile:', error);
      throw error;
    }
  },

  async createOrUpdateUser(user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: user.displayName || 'İsimsiz Kullanıcı',
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error in createOrUpdateUser:', error);
      throw error;
    }
  }
};