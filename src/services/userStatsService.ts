import { photoService } from './photoService';

interface UserStats {
  totalPhotos: number;
  mostActiveYear: number | null;
  photosByYear: { [key: string]: number };
  latestUpload: string | null;
}

export const userStatsService = {
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const photos = await photoService.getPhotos({ userId });
      
      if (photos.length === 0) {
        return {
          totalPhotos: 0,
          mostActiveYear: null,
          photosByYear: {},
          latestUpload: null
        };
      }

      // Yıllara göre fotoğrafları grupla
      const photosByYear = photos.reduce((acc: { [key: string]: number }, photo) => {
        const year = photo.year.toString();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});

      // En çok fotoğraf olan yılı bul
      const mostActiveYear = Object.entries(photosByYear).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0];

      // En son yükleme tarihini bul
      const latestUpload = photos
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0]
        ?.uploadDate.toString() || null;

      return {
        totalPhotos: photos.length,
        mostActiveYear: parseInt(mostActiveYear),
        photosByYear,
        latestUpload
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
};