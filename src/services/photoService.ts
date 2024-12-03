// src/services/photoService.ts
import axios from 'axios';

const STORAGE_API = import.meta.env.VITE_STORAGE_API_URL;

interface PhotoMetadata {
  year: number;
  description: string;
  userId: string;
  userName: string;
}

interface PhotoFilters {
  year?: number;
  userId?: string;
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

      const response = await axios.post(`${STORAGE_API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      return response.data;
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  },

  async getPhotos(filters?: PhotoFilters) {
    try {
      const params = new URLSearchParams();
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.userId) params.append('userId', filters.userId);

      console.log('Fetching photos with filters:', filters);
      const response = await axios.get(`${STORAGE_API}/photos`, { params });
    
      const photos: PhotoMetadata[] = response.data as PhotoMetadata[];
      console.log('Fetched photos:', photos);

      if (filters?.userId) {
        return photos.filter((photo: any) => photo.userId === filters.userId);
      }

      return photos;
    } catch (error) {
      console.error('Fetch photos error:', error);
      throw error;
    }
  },

  getPhotoUrl(year: number, filename: string) {
    return `${STORAGE_API}/photos/${year}/${filename}`;
  },

  async deletePhoto(year: number, filename: string, userId: string) {
    try {
      const response = await axios.delete(
        `${STORAGE_API}/photos/${year}/${filename}`,
        { params: { userId } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};