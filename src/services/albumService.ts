// src/services/albumService.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    query, 
    where,
    updateDoc
  } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  export interface Album {
    id: string;
    title: string;
    description?: string;
    coverPhotoUrl?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    creatorName: string;
    isPublic: boolean;
    photos: Array<{
      filename: string;
      year: number;
      uploadDate: string;
      description?: string;
    }>;
  }
  
  export const albumService = {
    async createAlbum(albumData: Omit<Album, 'id'>): Promise<Album> {
      try {
        const albumsRef = collection(db, 'albums');
        const newAlbumRef = doc(albumsRef);
        const album: Album = {
          id: newAlbumRef.id,
          ...albumData
        };
  
        await setDoc(newAlbumRef, album);
        return album;
      } catch (error) {
        console.error('Error creating album:', error);
        throw error;
      }
    },
  
    async getAlbum(albumId: string): Promise<Album | null> {
      try {
        const albumRef = doc(db, 'albums', albumId);
        const albumDoc = await getDoc(albumRef);
        
        if (!albumDoc.exists()) {
          return null;
        }
  
        return { id: albumDoc.id, ...albumDoc.data() } as Album;
      } catch (error) {
        console.error('Error getting album:', error);
        throw error;
      }
    },
  
    async getUserAlbums(userId: string): Promise<Album[]> {
      try {
        const albumsRef = collection(db, 'albums');
        const q = query(albumsRef, where('createdBy', '==', userId));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Album));
      } catch (error) {
        console.error('Error getting user albums:', error);
        throw error;
      }
    },
  
    async getPublicAlbums(): Promise<Album[]> {
      try {
        const albumsRef = collection(db, 'albums');
        const q = query(albumsRef, where('isPublic', '==', true));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Album));
      } catch (error) {
        console.error('Error getting public albums:', error);
        throw error;
      }
    },
  
    async updateAlbum(albumId: string, updates: Partial<Album>): Promise<void> {
      try {
        const albumRef = doc(db, 'albums', albumId);
        await updateDoc(albumRef, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating album:', error);
        throw error;
      }
    },
  
    async deleteAlbum(albumId: string): Promise<void> {
      try {
        const albumRef = doc(db, 'albums', albumId);
        await deleteDoc(albumRef);
      } catch (error) {
        console.error('Error deleting album:', error);
        throw error;
      }
    },
  
    async addPhotosToAlbum(albumId: string, photos: Album['photos']): Promise<void> {
      try {
        const albumRef = doc(db, 'albums', albumId);
        const album = await this.getAlbum(albumId);
        
        if (!album) {
          throw new Error('Album not found');
        }
  
        const updatedPhotos = [...album.photos, ...photos];
        await updateDoc(albumRef, {
          photos: updatedPhotos,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error adding photos to album:', error);
        throw error;
      }
    },
  
    async removePhotosFromAlbum(albumId: string, photoFilenames: string[]): Promise<void> {
      try {
        const albumRef = doc(db, 'albums', albumId);
        const album = await this.getAlbum(albumId);
        
        if (!album) {
          throw new Error('Album not found');
        }
  
        const updatedPhotos = album.photos.filter(
          photo => !photoFilenames.includes(photo.filename)
        );
  
        await updateDoc(albumRef, {
          photos: updatedPhotos,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error removing photos from album:', error);
        throw error;
      }
    }
  };