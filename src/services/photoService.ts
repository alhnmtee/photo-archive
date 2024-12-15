import axios from 'axios';
import type { AxiosInstance } from 'axios';

interface PhotoMetadata {
  filename: string;
  year: number;
  description?: string;
  userId: string;
  userName: string;
  people?: string[];
  size: number;
  mimetype: string;
  path: string;
  uploadDate: string;
}

interface PhotoFilters {
  year?: number;
  userId?: string;
  person?: string;
}

interface UploadResponse {
  success: boolean;
  file: {
    filename: string;
    path: string;
    metadata: PhotoMetadata;
  };
}

class PhotoService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_STORAGE_API_URL,
      withCredentials: true,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: { response: { status: number; }; }) => {
        if (error.response?.status === 502) {
          console.error('Gateway error:', error);
        }
        return Promise.reject(error);
      }
    );
  }

  async uploadPhoto(file: File, metadata: Omit<PhotoMetadata, 'size' | 'mimetype' | 'path' | 'uploadDate'>): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('year', metadata.year.toString());
      formData.append('description', metadata.description || '');
      formData.append('userId', metadata.userId);
      formData.append('userName', metadata.userName);
      formData.append('people', JSON.stringify(metadata.people || []));

      const response = await this.axiosInstance.post<UploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async getPhotos(filters?: PhotoFilters): Promise<PhotoMetadata[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.person) params.append('person', filters.person);

      const response = await this.axiosInstance.get<PhotoMetadata[]>('/photos', { params });
      return response.data;
    } catch (error) {
      console.error('Fetch photos error:', error);
      throw error;
    }
  }
  async updateDescription(year: number, filename: string, description: string): Promise<{ success: boolean }> {
    try {
      const response = await this.axiosInstance.patch(
        `/photos/${year}/${filename}/description`,
        { description }
      );
      return response.data;
    } catch (error) {
      console.error('Update description error:', error);
      throw error;
    }
  }

  getPhotoUrl(year: number, filename: string): string {
    const supportsWebP = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;

    return `${import.meta.env.VITE_STORAGE_API_URL}/photos/${year}/${filename}${supportsWebP ? '?format=webp' : ''}`;
  }

  async deletePhoto(year: number, filename: string, userId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.axiosInstance.delete(`/photos/${year}/${filename}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Delete photo error:', error);
      throw error;
    }
  }

  async updatePeople(year: number, filename: string, people: string[]): Promise<{ success: boolean }> {
    try {
      const response = await this.axiosInstance.patch(
        `/photos/${year}/${filename}/people`,
        { people }
      );
      return response.data;
    } catch (error) {
      console.error('Update people error:', error);
      throw error;
    }
  }

  async getAllPeople(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get<string[]>('/people');
      return response.data;
    } catch (error) {
      console.error('Fetch people error:', error);
      throw error;
    }
  }
}


export const photoService = new PhotoService();