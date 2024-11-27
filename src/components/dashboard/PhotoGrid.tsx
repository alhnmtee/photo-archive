import { useEffect, useState } from 'react';
import {
  SimpleGrid,
  Image,
  Box,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Center,
  VStack,
} from '@chakra-ui/react';
import { photoService } from '../../services/photoService';

interface Photo {
  filename: string;
  year: number;
  description: string;
  userId: string;
  userName: string;
  path: string;
  uploadDate: string;
}

interface PhotoGridProps {
  year?: number;
  userId?: string;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ year, userId }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const fetchedPhotos = await photoService.getPhotos({ year, userId }) as Photo[];
      setPhotos(fetchedPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [year, userId]);

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    onOpen();
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (photos.length === 0) {
    return (
      <Center h="200px">
        <Text>Henüz fotoğraf yüklenmemiş</Text>
      </Center>
    );
  }

  return (
    <>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
        {photos.map((photo) => (
          <Box
            key={photo.filename}
            cursor="pointer"
            onClick={() => handlePhotoClick(photo)}
            borderRadius="lg"
            overflow="hidden"
            position="relative"
            _hover={{ transform: 'scale(1.02)' }}
            transition="all 0.2s"
            bg="white"
            boxShadow="sm"
          >
            <Image
              src={photoService.getPhotoUrl(photo.year, photo.filename)}
              alt={photo.description || 'Fotoğraf'}
              objectFit="cover"
              w="100%"
              h="200px"
            />
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="blackAlpha.600"
              p={2}
            >
              <Text color="white" fontSize="sm">
                {photo.year}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      {/* Fotoğraf Detay Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPhoto?.description || 'Fotoğraf Detay'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPhoto && (
              <VStack spacing={4}>
                <Image
                  src={photoService.getPhotoUrl(
                    selectedPhoto.year,
                    selectedPhoto.filename
                  )}
                  alt={selectedPhoto.description || 'Fotoğraf'}
                  w="100%"
                  borderRadius="md"
                />
                <Box w="100%">
                  <Text fontSize="sm" color="gray.600">
                    Yükleyen: {selectedPhoto.userName}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Tarih:{' '}
                    {new Date(selectedPhoto.uploadDate).toLocaleDateString('tr-TR')}
                  </Text>
                  {selectedPhoto.description && (
                    <Text mt={2}>{selectedPhoto.description}</Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};