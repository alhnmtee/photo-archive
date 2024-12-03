// src/services/commentService.ts
import axios from 'axios';

const STORAGE_API = import.meta.env.VITE_STORAGE_API_URL;

export interface Comment {
  id: string;
  photoId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: string;
}

export const commentService = {
  async addComment(photoId: string, content: string, userData: { 
    userId: string; 
    userName: string; 
    userPhotoURL?: string; 
  }) {
    try {
      const response = await axios.post(`${STORAGE_API}/comments`, {
        photoId,
        content,
        userId: userData.userId,
        userName: userData.userName,
        userPhotoURL: userData.userPhotoURL
      });
      return response.data;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  async getComments(photoId: string) {
    try {
      const response = await axios.get(`${STORAGE_API}/comments/${photoId}`);
      return response.data as Comment[];
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  },

  async deleteComment(commentId: string, userId: string) {
    try {
      const response = await axios.delete(`${STORAGE_API}/comments/${commentId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }
};