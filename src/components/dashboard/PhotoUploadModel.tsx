import { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Progress,
  Box,
  Image,
  useToast
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { photoService } from '../../services/photoService';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ 
  isOpen, 
  onClose,
  onUploadSuccess 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [description, setDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { currentUser } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser || !year) {
      toast({
        title: 'Hata',
        description: 'Lütfen tüm alanları doldurun',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    try {
      const simulateProgress = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(simulateProgress);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await photoService.uploadPhoto(selectedFile, {
        year: parseInt(year),
        description,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonim'
      });

      clearInterval(simulateProgress);
      setUploadProgress(100);

      toast({
        title: 'Başarılı',
        description: 'Fotoğraf başarıyla yüklendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onUploadSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Hata',
        description: 'Fotoğraf yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview('');
    setYear(new Date().getFullYear().toString());
    setDescription('');
    setUploadProgress(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Fotoğraf Yükle</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Box
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="md"
              p={4}
              w="100%"
              textAlign="center"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <Image src={preview} alt="Preview" maxH="200px" mx="auto" />
              ) : (
                <Box>
                  <p>Fotoğraf seçmek için tıklayın</p>
                  <p>veya sürükleyip bırakın</p>
                </Box>
              )}
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                display="none"
              />
            </Box>

            <FormControl>
              <FormLabel>Yıl</FormLabel>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Açıklama</FormLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fotoğraf hakkında açıklama ekleyin"
              />
            </FormControl>

            {uploading && (
              <Progress
                value={uploadProgress}
                width="100%"
                borderRadius="md"
                colorScheme="blue"
              />
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            İptal
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleUpload}
            isLoading={uploading}
            loadingText="Yükleniyor..."
          >
            Yükle
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};