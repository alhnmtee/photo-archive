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
  IconButton,
  HStack,
  Button,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
  List,
  ListItem,
  Avatar,
  Divider,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons';
import { photoService } from '../../services/photoService';
import { useAuth } from '../../contexts/AuthContext';
import { useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PhotoComments } from './PhotoComments';

interface Photo {
  filename: string;
  year: number;
  description: string;
  userId: string;
  userName: string;
  url: string;
  uploadDate: string;
}

interface PhotoGridProps {
  year?: number;
  userId?: string;
  onGridRefreshed?: () => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ 
  year, 
  userId,
  onGridRefreshed 
}) => {
  const { viewMode, gridSize } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Silme dialog kontrolü
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onDeleteClose = () => setIsDeleteOpen(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      console.log('Fetching photos for userId:', userId); 
      
      const filters: { year?: number; userId?: string } = {};
      if (year) filters.year = year;
      if (userId) filters.userId = userId;
  
      const fetchedPhotos = await photoService.getPhotos(filters) as Photo[];
      console.log('Fetched photos:', fetchedPhotos); 
  
      const sortedPhotos = [...fetchedPhotos].sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
  
      setPhotos(sortedPhotos);
      if (typeof onGridRefreshed === 'function') {
        onGridRefreshed(); 
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Hata',
        description: 'Fotoğraflar yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPhotos();
  }, [year, userId]);

  const handlePhotoClick = (photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
    onOpen();
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < photos.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !currentUser) return;

    try {
      await photoService.deletePhoto(
        selectedPhoto.year,
        selectedPhoto.filename,
        currentUser.uid
      );

      toast({
        title: 'Başarılı',
        description: 'Fotoğraf başarıyla silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      const newPhotos = photos.filter(p => p.filename !== selectedPhoto.filename);
      setPhotos(newPhotos);
      onDeleteClose();
      onClose();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Fotoğraf silinirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const togglePhotoSelection = (photo: Photo) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photo.filename)) {
      newSelection.delete(photo.filename);
    } else {
      newSelection.add(photo.filename);
    }
    setSelectedPhotos(newSelection);
  };
  
  // Toplu silme işlemi için yeni fonksiyon
  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
  
    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;
  
    try {
      await Promise.all(
        Array.from(selectedPhotos).map(async (filename) => {
          const photo = photos.find(p => p.filename === filename);
          if (!photo || !currentUser) return;
  
          try {
            await photoService.deletePhoto(photo.year, photo.filename, currentUser.uid);
            successCount++;
          } catch (error) {
            console.error(`Error deleting ${filename}:`, error);
            failCount++;
          }
        })
      );
  
      // Başarı mesajı göster
      toast({
        title: 'Silme İşlemi Tamamlandı',
        description: `${successCount} fotoğraf başarıyla silindi${failCount > 0 ? `, ${failCount} fotoğraf silinemedi` : ''}`,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
  
      // Seçim modunu kapat ve listeyi yenile
      if (successCount > 0) {
        setIsSelectionMode(false);
        setSelectedPhotos(new Set());
        fetchPhotos();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: 'Hata',
        description: 'Fotoğraflar silinirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getGridColumns = () => {
    switch (gridSize) {
      case 'small':
        return { base: 2, sm: 3, md: 4, lg: 6 };
      case 'large':
        return { base: 1, sm: 2, md: 3, lg: 4 };
      default: // medium
        return { base: 1, sm: 2, md: 3, lg: 5 };
    }
  };

  const getImageHeight = () => {
    switch (gridSize) {
      case 'small':
        return '150px';
      case 'large':
        return '300px';
      default: // medium
        return '200px';
    }
  };

 // Grid görünümü için yeni render fonksiyonu
const renderGridView = () => (
  <Box>
    {/* Seçim modu kontrolleri */}
    <HStack spacing={4} mb={4}>
      <Button
        size="sm"
        onClick={() => {
          setIsSelectionMode(!isSelectionMode);
          setSelectedPhotos(new Set());
        }}
      >
        {isSelectionMode ? 'Seçimi İptal Et' : 'Fotoğraf Seç'}
      </Button>
      {isSelectionMode && (
        <>
          <Text fontSize="sm" color="gray.500">
            {selectedPhotos.size} fotoğraf seçildi
          </Text>
          <Button
            size="sm"
            colorScheme="red"
            onClick={handleBulkDelete}
            isLoading={isBulkDeleting}
            isDisabled={selectedPhotos.size === 0}
          >
            Seçilenleri Sil
          </Button>
        </>
      )}
    </HStack>

    {/* Fotoğraf grid'i */}
    <SimpleGrid columns={getGridColumns()} spacing={4}>
      {photos.map((photo, index) => (
        <Box
          key={photo.filename}
          cursor="pointer"
          onClick={() => isSelectionMode ? togglePhotoSelection(photo) : handlePhotoClick(photo, index)}
          borderRadius="lg"
          overflow="hidden"
          position="relative"
          _hover={{ transform: 'scale(1.02)' }}
          transition="all 0.2s"
          bg={bgColor}
          boxShadow="sm"
          border={isSelectionMode && selectedPhotos.has(photo.filename) ? '3px solid' : '1px solid'}
          borderColor={isSelectionMode && selectedPhotos.has(photo.filename) ? 'blue.500' : borderColor}
        >
          <Image
            src={photoService.getPhotoUrl(photo.year, photo.filename)}
            alt={photo.description || 'Fotoğraf'}
            objectFit="cover"
            w="100%"
            h={getImageHeight()}
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
              {format(new Date(photo.uploadDate), 'dd MMMM yyyy', { locale: tr })}
            </Text>
          </Box>
        </Box>
      ),)}
    </SimpleGrid>
  </Box>
);

// Liste görünümü için güncelleme
const renderListView = () => (
  <Box>
    {/* Seçim modu kontrolleri */}
    <HStack spacing={4} mb={4}>
      <Button
        size="sm"
        onClick={() => {
          setIsSelectionMode(!isSelectionMode);
          setSelectedPhotos(new Set());
        }}
      >
        {isSelectionMode ? 'Seçimi İptal Et' : 'Fotoğraf Seç'}
      </Button>
      {isSelectionMode && (
        <>
          <Text fontSize="sm" color="gray.500">
            {selectedPhotos.size} fotoğraf seçildi
          </Text>
          <Button
            size="sm"
            colorScheme="red"
            onClick={handleBulkDelete}
            isLoading={isBulkDeleting}
            isDisabled={selectedPhotos.size === 0}
          >
            Seçilenleri Sil
          </Button>
        </>
      )}
    </HStack>

    <List spacing={3}>
      {photos.map((photo, index) => (
        <ListItem
          key={photo.filename}
          onClick={() => isSelectionMode ? togglePhotoSelection(photo) : handlePhotoClick(photo, index)}
          cursor="pointer"
          borderRadius="md"
          overflow="hidden"
          bg={bgColor}
          boxShadow="sm"
          _hover={{ transform: 'translateX(8px)' }}
          transition="all 0.2s"
          p={4}
          border={isSelectionMode && selectedPhotos.has(photo.filename) ? '2px solid' : '1px solid'}
          borderColor={isSelectionMode && selectedPhotos.has(photo.filename) ? 'blue.500' : borderColor}
        >
          <HStack spacing={4}>
            <Image
              src={photoService.getPhotoUrl(photo.year, photo.filename)}
              alt={photo.description || 'Fotoğraf'}
              objectFit="cover"
              boxSize="100px"
              borderRadius="md"
            />
            <VStack align="start" flex={1}>
              <Text fontWeight="bold" color={textColor}>
                {photo.description || 'İsimsiz Fotoğraf'}
              </Text>
              <Text fontSize="sm" color={textColor}>
                {format(new Date(photo.uploadDate), 'dd MMMM yyyy', { locale: tr })}
              </Text>
              <Text fontSize="sm" color={textColor}>
                Yükleyen: {photo.userName}
              </Text>
            </VStack>
          </HStack>
        </ListItem>
      ))}
    </List>
  </Box>
);

// Timeline görünümü için güncelleme
const renderTimelineView = () => {
  const groupedPhotos = photos.reduce((groups, photo) => {
    const date = format(new Date(photo.uploadDate), 'MMMM yyyy', { locale: tr });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(photo);
    return groups;
  }, {} as Record<string, Photo[]>);

  return (
    <Box>
      {/* Seçim modu kontrolleri */}
      <HStack spacing={4} mb={4}>
        <Button
          size="sm"
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedPhotos(new Set());
          }}
        >
          {isSelectionMode ? 'Seçimi İptal Et' : 'Fotoğraf Seç'}
        </Button>
        {isSelectionMode && (
          <>
            <Text fontSize="sm" color="gray.500">
              {selectedPhotos.size} fotoğraf seçildi
            </Text>
            <Button
              size="sm"
              colorScheme="red"
              onClick={handleBulkDelete}
              isLoading={isBulkDeleting}
              isDisabled={selectedPhotos.size === 0}
            >
              Seçilenleri Sil
            </Button>
          </>
        )}
      </HStack>

      <VStack align="stretch" spacing={8}>
        {Object.entries(groupedPhotos).map(([date, groupPhotos]) => (
          <Box key={date}>
            <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
              {date}
            </Text>
            <SimpleGrid columns={getGridColumns()} spacing={4}>
              {groupPhotos.map((photo, index) => (
                <Box
                  key={photo.filename}
                  cursor="pointer"
                  onClick={() => isSelectionMode ? togglePhotoSelection(photo) : handlePhotoClick(photo, index)}
                  borderRadius="lg"
                  overflow="hidden"
                  position="relative"
                  _hover={{ transform: 'scale(1.02)' }}
                  transition="all 0.2s"
                  bg={bgColor}
                  boxShadow="sm"
                  border={isSelectionMode && selectedPhotos.has(photo.filename) ? '3px solid' : '1px solid'}
                  borderColor={isSelectionMode && selectedPhotos.has(photo.filename) ? 'blue.500' : borderColor}
                >
                  <Image
                    src={photoService.getPhotoUrl(photo.year, photo.filename)}
                    alt={photo.description || 'Fotoğraf'}
                    objectFit="cover"
                    w="100%"
                    h={getImageHeight()}
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
                      {format(new Date(photo.uploadDate), 'dd MMMM yyyy', { locale: tr })}
                    </Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};
        <Box/>

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
        <Text color={textColor}>Henüz fotoğraf yüklenmemiş</Text>
      </Center>
    );
  }

  


  const renderCalendarView = () => {
    // Fotoğrafları aylara göre grupla
    const groupedByMonth = photos.reduce((acc, photo) => {
      const date = new Date(photo.uploadDate);
      const monthKey = format(date, 'MMMM yyyy', { locale: tr });
      
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(photo);
      return acc;
    }, {} as Record<string, Photo[]>);
  
    return (
      <VStack spacing={8}>
        {Object.entries(groupedByMonth).map(([monthYear, monthPhotos]) => (
          <Box key={monthYear} w="full">
            <Text fontSize="2xl" fontWeight="bold" mb={4} color={textColor}>
              {monthYear}
            </Text>
            <SimpleGrid columns={4} spacing={4}>
              {monthPhotos.map((photo, index) => (
                <Box
                  key={photo.filename}
                  cursor="pointer"
                  onClick={() => handlePhotoClick(photo, index)}
                  position="relative"
                >
                  <Image
                    src={photoService.getPhotoUrl(photo.year, photo.filename)}
                    alt={photo.description || 'Fotoğraf'}
                    objectFit="cover"
                    w="100%"
                    h="150px"
                    borderRadius="md"
                  />
                  <Text 
                    position="absolute" 
                    bottom={2} 
                    right={2} 
                    color="white" 
                    fontSize="sm"
                    bg="blackAlpha.600"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {format(new Date(photo.uploadDate), 'dd', { locale: tr })}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </VStack>
    );
  };
  
  // Yıl/Ay bazında kategorize görünüm
  const renderYearMonthView = () => {
    const groupedByYear = photos.reduce((acc, photo) => {
      if (!acc[photo.year]) {
        acc[photo.year] = {};
      }
      
      const month = format(new Date(photo.uploadDate), 'MMMM', { locale: tr });
      if (!acc[photo.year][month]) {
        acc[photo.year][month] = [];
      }
      
      acc[photo.year][month].push(photo);
      return acc;
    }, {} as Record<number, Record<string, Photo[]>>);
  
    return (
      <VStack spacing={8} align="stretch">
        {Object.entries(groupedByYear)
          .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
          .map(([year, months]) => (
            <Box key={year} bg={bgColor} p={6} borderRadius="lg">
              <Text fontSize="2xl" fontWeight="bold" mb={6} color={textColor}>
                {year}
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {Object.entries(months).map(([month, monthPhotos]) => (
                  <Box key={month} borderWidth="1px" borderRadius="lg" p={4}>
                    <Text fontSize="lg" fontWeight="bold" mb={4} color={textColor}>
                      {month} ({monthPhotos.length})
                    </Text>
                    <SimpleGrid columns={3} spacing={2}>
                      {monthPhotos.slice(0, 6).map((photo, index) => (
                        <Image
                          key={photo.filename}
                          src={photoService.getPhotoUrl(photo.year, photo.filename)}
                          alt={photo.description || 'Fotoğraf'}
                          objectFit="cover"
                          w="100%"
                          h="60px"
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => handlePhotoClick(photo, index)}
                        />
                      ))}
                    </SimpleGrid>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          ))}
      </VStack>
    );
  };
  
  // Kullanıcılara göre gruplandırma görünümü
  const renderUsersView = () => {
    const groupedByUser = photos.reduce((acc, photo) => {
      if (!acc[photo.userId]) {
        acc[photo.userId] = {
          userName: photo.userName,
          photos: []
        };
      }
      acc[photo.userId].photos.push(photo);
      return acc;
    }, {} as Record<string, { userName: string; photos: Photo[] }>);
  
    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {Object.entries(groupedByUser).map(([userId, { userName, photos: userPhotos }]) => (
          <Box key={userId} bg={bgColor} p={6} borderRadius="lg">
            <HStack mb={4}>
              <Avatar name={userName} size="sm" />
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {userName}
              </Text>
              <Text color="gray.500" fontSize="sm">
                ({userPhotos.length} fotoğraf)
              </Text>
            </HStack>
            <SimpleGrid columns={4} spacing={2}>
              {userPhotos.slice(0, 8).map((photo, index) => (
                <Image
                  key={photo.filename}
                  src={photoService.getPhotoUrl(photo.year, photo.filename)}
                  alt={photo.description || 'Fotoğraf'}
                  objectFit="cover"
                  w="100%"
                  h="80px"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => handlePhotoClick(photo, index)}
                />
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </SimpleGrid>
    );
  };




  return (
    <>
          {viewMode === 'grid' && renderGridView()}
    {viewMode === 'list' && renderListView()}
    {viewMode === 'timeline' && renderTimelineView()}
    {viewMode === 'calendar' && renderCalendarView()}
    {viewMode === 'yearMonth' && renderYearMonthView()}
    {viewMode === 'users' && renderUsersView()}

      {/* Fotoğraf Detay Modalı */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader color={textColor}>
            {selectedPhoto?.description || 'Fotoğraf Detay'}
          </ModalHeader>
          <ModalCloseButton color={textColor} />
            <ModalBody pb={6}>
              {selectedPhoto && (
                <VStack spacing={4}>
                  <Box position="relative" width="100%">
                    <Image
                      src={photoService.getPhotoUrl(selectedPhoto.year, selectedPhoto.filename)}
                      alt={selectedPhoto.description || 'Fotoğraf'}
                      w="100%"
                      borderRadius="md"
                    />
                    
                    {/* Gezinme Butonları */}
                    <HStack 
                      position="absolute" 
                      width="100%" 
                      justify="space-between" 
                      top="50%" 
                      transform="translateY(-50%)"
                      px={4}
                    >
                      <IconButton
                        aria-label="Önceki fotoğraf"
                        icon={<ChevronLeftIcon />}
                        onClick={handlePrevPhoto}
                        isDisabled={selectedPhotoIndex === 0}
                        colorScheme="blue"
                        variant="solid"
                        opacity={0.8}
                      />
                      <IconButton
                        aria-label="Sonraki fotoğraf"
                        icon={<ChevronRightIcon />}
                        onClick={handleNextPhoto}
                        isDisabled={selectedPhotoIndex === photos.length - 1}
                        colorScheme="blue"
                        variant="solid"
                        opacity={0.8}
                      />
                    </HStack>
                  </Box>

                  <Box w="100%">
                    <HStack justify="space-between" mb={2}>
                      <Box>
                        <Text fontSize="sm" color={textColor}>
                          Yükleyen: {selectedPhoto.userName}
                        </Text>
                        <Text fontSize="sm" color={textColor}>
                          Tarih:{' '}
                          {format(new Date(selectedPhoto.uploadDate), 'dd MMMM yyyy', { locale: tr })}
                        </Text>
                      </Box>
                      {currentUser && currentUser.uid === selectedPhoto.userId && (
                        <IconButton
                          aria-label="Fotoğrafı sil"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => setIsDeleteOpen(true)}
                        />
                      )}
                    </HStack>
                    {selectedPhoto.description && (
                      <Text mt={2} color={textColor}>{selectedPhoto.description}</Text>
                    )}
                  </Box>

                  {/* Yorumlar bölümü */}
                  <Divider my={4} />
                  <Box w="100%">
                    <Text fontSize="lg" fontWeight="bold" mb={4} color={textColor}>
                      Yorumlar
                    </Text>
                    <PhotoComments photoId={selectedPhoto.filename} />
                  </Box>
                </VStack>
              )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Silme Onay Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={bgColor}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={textColor}>
              Fotoğrafı Sil
            </AlertDialogHeader>

            <AlertDialogBody color={textColor}>
              Bu fotoğrafı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                İptal
              </Button>
              <Button colorScheme="red" onClick={handleDeletePhoto} ml={3}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};