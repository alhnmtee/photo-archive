const imageOptimizer = {
    // Maximum boyutlar
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    MAX_SIZE_MB: 2,
    QUALITY: 0.8,
  
    async optimizeImage(file: Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
          const img = new Image();
          if (event.target) {
            img.src = event.target.result as string;
          } else {
            reject(new Error('FileReader event target is null'));
          }
          
          img.onload = () => {
            // Boyut hesaplama
            let width = img.width;
            let height = img.height;
            
            // Aspect ratio'yu koruyarak yeniden boyutlandırma
            if (width > this.MAX_WIDTH) {
              height = Math.round((height * this.MAX_WIDTH) / width);
              width = this.MAX_WIDTH;
            }
            
            if (height > this.MAX_HEIGHT) {
              width = Math.round((width * this.MAX_HEIGHT) / height);
              height = this.MAX_HEIGHT;
            }
            
            // Canvas oluştur ve çiz
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
            } else {
              reject(new Error('Canvas context is null'));
              return;
            }
            
            // JPEG olarak dönüştür ve compress et
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Blob oluşturulamadı'));
                return;
              }
              
              // Yeni dosya oluştur
              const optimizedFile = new File([blob], (file as File).name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              resolve({
                file: optimizedFile,
                width,
                height,
                originalSize: file.size,
                optimizedSize: blob.size,
                compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(2)
              });
            }, 'image/jpeg', this.QUALITY);
          };
          
          img.onerror = reject;
        };
        
        reader.onerror = reject;
      });
    },
  
    async processFiles(files: any) {
      const results = [];
      const errors = [];
  
      for (const file of files) {
        try {
          // Sadece resim dosyalarını işle
          if (!file.type.startsWith('image/')) {
            errors.push({ file, error: 'Desteklenmeyen dosya formatı' });
            continue;
          }
  
          const result = await this.optimizeImage(file);
          results.push(result);
        } catch (error) {
          errors.push({ file, error: (error as Error).message });
        }
      }
  
      return { results, errors };
    }
  };
  
  export default imageOptimizer;