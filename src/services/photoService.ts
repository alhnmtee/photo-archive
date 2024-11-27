// src/services/photoService.ts
import axios from 'axios';

const STORAGE_API = import.meta.env.VITE_STORAGE_API_URL;

interface PhotoMetadata {
  year: number;
  description: string;
  userId: string;
  userName: string;
}



export const photoService = {
  async uploadPhoto(file: File, metadata: PhotoMetadata) {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('year', metadata.year.toString());
      formData.append('description', metadata.description);
      formData.append('userId', metadata.userId);
      formData.append('userName', metadata.userName);

      // Debug için log ekleyelim
      console.log('Uploading to:', `${STORAGE_API}/upload`);
      console.log('FormData contents:', {
        year: metadata.year,
        description: metadata.description,
        userId: metadata.userId,
        userName: metadata.userName
      });

      const response = await axios.post(`${STORAGE_API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Upload error details:', err.response?.data || err);
      throw error;
    }
  },

  async getPhotos(filters?: { year?: number; userId?: string }) {
    try {
      const params = new URLSearchParams();
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.userId) params.append('userId', filters.userId);

      console.log('Fetching photos from:', `${STORAGE_API}/photos`);
      const response = await axios.get(`${STORAGE_API}/photos`, { params });
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Fetch photos error:', err.response?.data || err);
      throw error;
    }
  },

  getPhotoUrl(year: number, filename: string) {
    return `${STORAGE_API}/photos/${year}/${filename}`;
  }
};