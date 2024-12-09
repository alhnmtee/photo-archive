// src/pages/AlbumDetail.tsx
import { useState } from 'react';
//import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  IconButton,
  Button,
  useColorModeValue,
  useDisclosure,
  SimpleGrid,
  Image,
  Badge,
  Spinner,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { 
  //EditIcon, 
  DeleteIcon, 
  LockIcon, 
  UnlockIcon,
  AddIcon,
  ChevronLeftIcon 
} from '@chakra-ui/icons';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { albumService, Album } from '../services/albumService';
import { photoService } from '../services/photoService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
//import { PhotoGrid } from '../components/dashboard/PhotoGrid';

export const AlbumDetail = () => {
  const { albumId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  // Renk değişkenleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Albüm verilerini çek
  const { data: album, isLoading: isLoadingAlbum } = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => albumService.getAlbum(albumId || ''),
    enabled: !!albumId,
  });

  // Tüm fotoğrafları çek
  const { data: allPhotos = [], isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['photos'],
    queryFn: () => photoService.getPhotos(),
    enabled: isOpen, // Sadece fotoğraf ekleme modalı açıkken yükle
  });

  // Mutations
  const updateAlbumMutation = useMutation({
    mutationFn: ({ albumId, updates }: { albumId: string; updates: Partial<Album> }) =>
      albumService.updateAlbum(albumId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      toast({
        title: 'Albüm güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: (albumId: string) => albumService.deleteAlbum(albumId),
    onSuccess: () => {
      navigate('/albums');
      toast({
        title: 'Albüm silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  });

  const handleDeleteAlbum = async () => {
    if (!albumId) return;
    
    if (window.confirm('Bu albümü silmek istediğinize emin misiniz?')) {
      deleteAlbumMutation.mutate(albumId);
    }
  };

  const handleVisibilityToggle = () => {
    if (!album || !albumId) return;

    updateAlbumMutation.mutate({
      albumId,
      updates: { isPublic: !album.isPublic }
    });
  };

  const togglePhotoSelection = (photo: any) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photo.filename)) {
      newSelection.delete(photo.filename);
    } else {
      newSelection.add(photo.filename);
    }
    setSelectedPhotos(newSelection);
  };

  const handleAddPhotos = async () => {
    if (!album || !albumId) return;

    const selectedPhotosList = allPhotos.filter(photo => selectedPhotos.has(photo.filename))
      .map(photo => ({
        filename: photo.filename,
        year: photo.year,
        uploadDate: typeof photo.uploadDate === 'string' ? photo.uploadDate : photo.uploadDate.toString(),
        description: photo.description
      }));

    if (selectedPhotosList.length === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen en az bir fotoğraf seçin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await albumService.addPhotosToAlbum(albumId, selectedPhotosList);
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      toast({
        title: 'Fotoğraflar eklendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setSelectedPhotos(new Set());
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Fotoğraflar eklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemovePhoto = async (filename: string) => {
    if (!album || !albumId) return;

    try {
      await albumService.removePhotosFromAlbum(albumId, [filename]);
      queryClient.invalidateQueries({ queryKey: ['album', albumId] });
      toast({
        title: 'Fotoğraf kaldırıldı',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Fotoğraf kaldırılırken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderPhotoSelectionGrid = () => (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
      {allPhotos
        .filter(photo => !album?.photos.find(p => p.filename === photo.filename))
        .map((photo) => (
          <Box
            key={photo.filename}
            position="relative"
            cursor="pointer"
            onClick={() => togglePhotoSelection(photo)}
            opacity={selectedPhotos.has(photo.filename) ? 1 : 0.7}
            transition="all 0.2s"
            _hover={{ opacity: 1 }}
          >
            <Image
              src={photoService.getPhotoUrl(photo.year, photo.filename)}
              alt={photo.description || 'Fotoğraf'}
              borderRadius="md"
              objectFit="cover"
              w="100%"
              h="150px"
            />
            {selectedPhotos.has(photo.filename) && (
              <Badge
                position="absolute"
                top={2}
                right={2}
                colorScheme="green"
              >
                Seçildi
              </Badge>
            )}
          </Box>
        ))}
    </SimpleGrid>
  );

  if (isLoadingAlbum) {
    return (
      <DashboardLayout>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </DashboardLayout>
    );
  }

  if (!album) {
    return (
      <DashboardLayout>
        <Container maxW="container.xl" py={8}>
          <Text>Albüm bulunamadı</Text>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Button
              leftIcon={<ChevronLeftIcon />}
              variant="ghost"
              onClick={() => navigate('/albums')}
              mb={4}
            >
              Albümlere Dön
            </Button>

            <Box 
              bg={bgColor} 
              p={6} 
              borderRadius="lg" 
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack justify="space-between" mb={4}>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color={textColor}>{album.title}</Heading>
                  <Text color="gray.500">
                    {format(new Date(album.createdAt), 'dd MMMM yyyy', { locale: tr })}
                  </Text>
                  <Text color="gray.500">
                    Oluşturan: {album.creatorName}
                  </Text>
                </VStack>

                {currentUser?.uid === album.createdBy && (
                  <HStack>
                    <IconButton
                      aria-label={album.isPublic ? 'Gizle' : 'Herkese Aç'}
                      icon={album.isPublic ? <UnlockIcon /> : <LockIcon />}
                      onClick={handleVisibilityToggle}
                    />
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      onClick={onOpen}
                    >
                      Fotoğraf Ekle
                    </Button>
                    <IconButton
                      aria-label="Delete album"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={handleDeleteAlbum}
                    />
                  </HStack>
                )}
              </HStack>

              {album.description && (
                <Text color={textColor} mb={4}>{album.description}</Text>
              )}

              <Badge colorScheme={album.isPublic ? 'green' : 'gray'}>
                {album.isPublic ? 'Herkese Açık' : 'Gizli'}
              </Badge>
            </Box>
          </Box>

          {/* Albümdeki Fotoğraflar */}
          <Box>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {album.photos.map((photo) => (
                <Box
                  key={photo.filename}
                  position="relative"
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <Image
                    src={photoService.getPhotoUrl(photo.year, photo.filename)}
                    alt={photo.description || 'Fotoğraf'}
                    objectFit="cover"
                    w="100%"
                    h="200px"
                  />
                  {currentUser?.uid === album.createdBy && (
                    <IconButton
                      aria-label="Remove photo"
                      icon={<DeleteIcon />}
                      size="sm"
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="red"
                      onClick={() => handleRemovePhoto(photo.filename)}
                    />
                  )}
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>

        {/* Fotoğraf Ekleme Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader color={textColor}>Fotoğraf Ekle</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {isLoadingPhotos ? (
                <Flex justify="center" py={8}>
                  <Spinner />
                </Flex>
              ) : (
                renderPhotoSelectionGrid()
              )}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={4}>
                <Text color="gray.500">
                  {selectedPhotos.size} fotoğraf seçildi
                </Text>
                <Button variant="ghost" onClick={onClose}>
                  İptal
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleAddPhotos}
                  isDisabled={selectedPhotos.size === 0}
                >
                  Ekle
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};