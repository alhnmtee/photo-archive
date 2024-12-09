// src/pages/Albums.tsx
import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  //Grid,
  Heading,
  useDisclosure,
  VStack,
  Text,
  SimpleGrid,
  Image,
  //Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Textarea,
  useToast,
  IconButton,
  HStack,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Flex,
  //Checkbox,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, LockIcon, CheckIcon } from '@chakra-ui/icons';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { albumService, Album } from '../services/albumService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
//import { PhotoGrid } from '../components/dashboard/PhotoGrid';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { photoService } from '../services/photoService';
import { useNavigate } from 'react-router-dom';
import {Icon } from '@chakra-ui/react';

export const Albums = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isPhotoSelectionMode, setIsPhotoSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  //const [albumPhotos, setAlbumPhotos] = useState<any[]>([]);
  const navigate = useNavigate();

  // Renk değişkenleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  //const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    coverPhotoUrl: ''
  });

  // Queries
  const { data: userAlbums = [], isLoading: isLoadingUserAlbums } = useQuery({
    queryKey: ['albums', 'user', currentUser?.uid],
    queryFn: () => albumService.getUserAlbums(currentUser?.uid || ''),
    enabled: !!currentUser
  });

  const { data: publicAlbums = [], isLoading: isLoadingPublicAlbums } = useQuery({
    queryKey: ['albums', 'public'],
    queryFn: () => albumService.getPublicAlbums()
  });

  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['photos'],
    queryFn: () => photoService.getPhotos(),
    enabled: isPhotoSelectionMode
  });

  // Mutations
  const createAlbumMutation = useMutation({
    mutationFn: (newAlbum: Omit<Album, 'id'>) => albumService.createAlbum(newAlbum),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast({
        title: 'Albüm oluşturuldu',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      handleCloseModal();
    }
  });

  const updateAlbumMutation = useMutation({
    mutationFn: ({ albumId, updates }: { albumId: string; updates: Partial<Album> }) =>
      albumService.updateAlbum(albumId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast({
        title: 'Albüm güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      handleCloseModal();
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: (albumId: string) => albumService.deleteAlbum(albumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast({
        title: 'Albüm silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  });

  const handleCreateAlbum = async () => {
    if (!currentUser || !formData.title) {
      toast({
        title: 'Hata',
        description: 'Lütfen albüm başlığı girin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const selectedPhotosList = photos.filter(photo => selectedPhotos.has(photo.filename));
    const albumPhotos = selectedPhotosList.map(photo => ({
      filename: photo.filename,
      year: photo.year,
      uploadDate: new Date(photo.uploadDate).toISOString(),
      description: photo.description
    }));

    const newAlbum: Omit<Album, 'id'> = {
      title: formData.title,
      description: formData.description,
      coverPhotoUrl: selectedPhotosList[0]?.path || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      creatorName: currentUser.displayName || 'Anonim',
      isPublic: formData.isPublic,
      photos: albumPhotos,
    };

    createAlbumMutation.mutate(newAlbum);
  };

  const handleUpdateAlbum = async () => {
    if (!selectedAlbum || !formData.title) return;

    const updates: Partial<Album> = {
      title: formData.title,
      description: formData.description,
      isPublic: formData.isPublic,
    };

    if (selectedPhotos.size > 0) {
      const selectedPhotosList = photos.filter(photo => selectedPhotos.has(photo.filename));
      const updatedPhotos = selectedPhotosList.map(photo => ({
        filename: photo.filename,
        year: photo.year,
        uploadDate: new Date(photo.uploadDate).toISOString(),
        description: photo.description
      }));
      updates.photos = updatedPhotos;
      updates.coverPhotoUrl = selectedPhotosList[0]?.path || '';
    }

    updateAlbumMutation.mutate({
      albumId: selectedAlbum.id,
      updates
    });
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (window.confirm('Bu albümü silmek istediğinize emin misiniz?')) {
      deleteAlbumMutation.mutate(albumId);
    }
  };

  const handleEditAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setFormData({
      title: album.title,
      description: album.description || '',
      isPublic: album.isPublic,
      coverPhotoUrl: album.coverPhotoUrl || ''
    });
    setSelectedPhotos(new Set(album.photos.map(p => p.filename)));
    setIsPhotoSelectionMode(true);
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedAlbum(null);
    setFormData({
      title: '',
      description: '',
      isPublic: true,
      coverPhotoUrl: ''
    });
    setSelectedPhotos(new Set());
    setIsPhotoSelectionMode(false);
    onClose();
  };

  const handleCreateNewAlbum = () => {
    setIsPhotoSelectionMode(true);
    onOpen();
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
  
  const renderAlbumGrid = (albums: Album[]) => (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
      {albums.map((album) => (
        <Box
          key={album.id}
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          bg={bgColor}
          borderColor={borderColor}
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-4px)', shadow: 'md' }}
          onClick={() => navigate(`/albums/${album.id}`)} 
          cursor="pointer"
        >
          <Box position="relative" h="200px">
            <Image
              src={album.photos[0] ? 
                photoService.getPhotoUrl(album.photos[0].year, album.photos[0].filename) :
                '/api/placeholder/400/200'
              }
              alt={album.title}
              objectFit="cover"
              w="100%"
              h="100%"
            />
            {!album.isPublic && (
              <Box position="absolute" top={2} right={2}>
                <LockIcon color="white" />
              </Box>
            )}
          </Box>
         

          

          <Box p={4}>
            <HStack justify="space-between" mb={2}>
              <Heading size="md" color={textColor} noOfLines={1}>
                {album.title}
              </Heading>
              {currentUser?.uid === album.createdBy && (
                <HStack>
                  <IconButton
                    aria-label="Edit album"
                    icon={<EditIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditAlbum(album)}
                  />
                  <IconButton
                    aria-label="Delete album"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteAlbum(album.id)}
                  />
                </HStack>
              )}
            </HStack>

            <Text fontSize="sm" color={textColor} noOfLines={2} mb={2}>
              {album.description}
            </Text>

            <HStack justify="space-between" fontSize="sm" color="gray.500">
              <Text>{album.photos.length} fotoğraf</Text>
              <Text>
                {format(new Date(album.createdAt), 'dd MMM yyyy', { locale: tr })}
              </Text>
            </HStack>

            <Text fontSize="sm" color="gray.500" mt={2}>
              {album.creatorName}
            </Text>
          </Box>
        </Box>
      ))}
    </SimpleGrid>
  );

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between">
            <Heading size="lg" color={textColor}>Albümler</Heading>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={handleCreateNewAlbum}
            >
              Yeni Albüm
            </Button>
          </HStack>

          <Tabs variant="enclosed">
            <TabList>
              <Tab>Albümlerim</Tab>
              <Tab>Herkese Açık Albümler</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {isLoadingUserAlbums ? (
                  <Flex justify="center" py={8}>
                    <Spinner />
                  </Flex>
                ) : userAlbums.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>
                    Henüz albüm oluşturmamışsınız
                  </Text>
                ) : (
                  renderAlbumGrid(userAlbums)
                )}
              </TabPanel>

              <TabPanel>
                {isLoadingPublicAlbums ? (
                  <Flex justify="center" py={8}>
                    <Spinner />
                  </Flex>
                ) : publicAlbums.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>
                    Henüz herkese açık albüm yok
                  </Text>
                ) : (
                  renderAlbumGrid(publicAlbums)
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>

       
        <Modal 
          isOpen={isOpen} 
          onClose={handleCloseModal} 
          isCentered // Bu özelliği ekleyin
          size="4xl" // size'ı "full" yerine "4xl" yapalım
        >
          <ModalOverlay />
          <ModalContent bg={bgColor} mx={4}> {/* mx={4} ekleyin */}
            <ModalHeader color={textColor}>
              {selectedAlbum ? 'Albümü Düzenle' : 'Yeni Albüm Oluştur'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} w="100%" align="stretch">
                <FormControl isRequired>
                  <FormLabel color={textColor}>Albüm Başlığı</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Albüm başlığı girin"
                    bg={useColorModeValue('white', 'gray.700')}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Açıklama</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Albüm açıklaması girin (isteğe bağlı)"
                    bg={useColorModeValue('white', 'gray.700')}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-public" mb="0" color={textColor}>
                    Herkese Açık Albüm
                  </FormLabel>
                  <Switch
                    id="is-public"
                    isChecked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isPublic: e.target.checked
                    }))}
                  />
                </FormControl>

                <Box>
                  <Text mb={4} fontWeight="bold" color={textColor}>
                    Fotoğraf Seç
                  </Text>
                  {isLoadingPhotos ? (
                    <Flex justify="center" py={8}>
                      <Spinner />
                    </Flex>
                  ) : (
                    <SimpleGrid 
                      columns={{ base: 2, md: 3, lg: 4 }} 
                      spacing={4} 
                      maxH="400px"
                      overflowY="auto"
                      px={2}
                    >
                      {photos.map((photo) => (
                        <Box
                          key={photo.filename}
                          position="relative"
                          cursor="pointer"
                          onClick={() => togglePhotoSelection(photo)}
                          opacity={selectedPhotos.has(photo.filename) ? 1 : 0.7}
                          transition="all 0.2s"
                          _hover={{ opacity: 1 }}
                          borderRadius="md"
                          overflow="hidden"
                          boxShadow="sm"
                          h="160px" 
                          w="100%" 
                        >
                          <Image
                            src={photoService.getPhotoUrl(photo.year, photo.filename)}
                            alt={photo.description || 'Fotoğraf'}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                          />
                          {selectedPhotos.has(photo.filename) && (
                            <Flex
                              position="absolute"
                              top={0}
                              left={0}
                              right={0}
                              bottom={0}
                              bg="blackAlpha.600"
                              justify="center"
                              align="center"
                            >
                              <Icon as={CheckIcon} color="white" boxSize={6} />
                            </Flex>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <HStack spacing={4}>
                <Text color="gray.500">
                  {selectedPhotos.size} fotoğraf seçildi
                </Text>
                <Button variant="ghost" onClick={handleCloseModal}>
                  İptal
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={selectedAlbum ? handleUpdateAlbum : handleCreateAlbum}
                  isDisabled={!formData.title}
                >
                  {selectedAlbum ? 'Güncelle' : 'Oluştur'}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};