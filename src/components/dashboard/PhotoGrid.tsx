import { useCallback, useEffect, useMemo, useState } from 'react';
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
  FormControl,
  FormLabel,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon, MinusIcon, RepeatIcon,EditIcon, CheckIcon } from '@chakra-ui/icons';
import { photoService } from '../../services/photoService';
import { useAuth } from '../../contexts/AuthContext';
import { useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PhotoComments } from './PhotoComments';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
//import { LazyLoadImage } from  'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';



interface Photo {
  filename: string;
  year: number;
  description: string;
  userId: string;
  userName: string;
  uploadDate: string; 
  path: string;
  size: number;
  mimetype: string;
  people: string[];
}

interface PhotoGridProps {
  year?: number;
  userId?: string;
  onGridRefreshed?: () => void;
  filters?: {
    years: number[];
    people: string[];
    searchQuery: string;
  };
}



export const PhotoGrid = React.memo(({ 
  year, 
  userId,
  onGridRefreshed,
  filters,
}: PhotoGridProps) => {
  const { viewMode, gridSize } = useTheme();
  
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  
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

  const [editMode, setEditMode] = useState(false);
  const [newPerson, setNewPerson] = useState('');
  const [editData, setEditData] = useState({
    description: '',
    people: [] as string[]
  });
  

  const handleEditSave = async () => {
    try {
      if (!selectedPhoto) return;
      
      await photoService.updatePeople(selectedPhoto.year, selectedPhoto.filename, editData.people);
      
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      setEditMode(false);
      toast({
        title: 'Başarılı',
        description: 'Fotoğraf detayları güncellendi',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Güncelleme sırasında bir hata oluştu', 
        status: 'error',
        duration: 3000,
      });
    }
  };


  const { data, isLoading } = useQuery({
    queryKey: ['photos', year, userId, filters],
    queryFn: () => photoService.getPhotos({ year, userId }),
    gcTime: 30 * 60 * 1000, // cacheTime yerine gcTime kullanıyoruz
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      onGridRefreshed?.();
    }
  }, [data, onGridRefreshed]);
  const filteredPhotos = useMemo(() => {
    if (!Array.isArray(data)) return [];
  
    return data.filter((photo: any) => {
      // Photo tipine dönüştür
      const typedPhoto: Photo = {
        ...photo,
        uploadDate: new Date(photo.uploadDate).toISOString(), // string'e çevir
        people: photo.people || []
      };
  
      if (filters?.years?.length && !filters.years.includes(typedPhoto.year)) {
        return false;
      }
  
      if (filters?.people?.length && !typedPhoto.people?.some(person => 
        filters.people.includes(person)
      )) {
        return false;
      }
  
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          typedPhoto.description?.toLowerCase().includes(query) ||
          typedPhoto.userName?.toLowerCase().includes(query) ||
          typedPhoto.people?.some(person => 
            person.toLowerCase().includes(query)
          )
        );
      }
  
      return true;
    }) as Photo[];
  }, [data, filters]);
  

  const handlePhotoClick = useCallback((photo: Photo, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
    onOpen();
  }, [onOpen]);

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < filteredPhotos.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  };

  const queryClient = useQueryClient(); // component başında ekleyin

const handleDeletePhoto = async () => {
  if (!selectedPhoto || !currentUser) return;

  try {
    await photoService.deletePhoto(
      selectedPhoto.year,
      selectedPhoto.filename,
      currentUser.uid
    );

    // Cache'i güncelle
    queryClient.invalidateQueries({ queryKey: ['photos'] });

    toast({
      title: 'Başarılı',
      description: 'Fotoğraf başarıyla silindi',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

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
//Klavye Kontrolleri
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        
        if (e.key === 'ArrowLeft') handlePrevPhoto();
        if (e.key === 'ArrowRight') handleNextPhoto();
        if (e.key === 'Escape') onClose();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handlePrevPhoto, handleNextPhoto, onClose]);

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
          const photo = filteredPhotos.find(p => p.filename === filename);
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
  
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['photos'] });
  
      toast({
        title: 'Silme İşlemi Tamamlandı',
        description: `${successCount} fotoğraf başarıyla silindi${failCount > 0 ? `, ${failCount} fotoğraf silinemedi` : ''}`,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
  
      if (successCount > 0) {
        setIsSelectionMode(false);
        setSelectedPhotos(new Set());
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
        return { base: 2, sm: 3, md: 4, lg: 5 };
      case 'medium':   
        return { base: 1, sm: 2, md: 3, lg: 4 };
      case 'large':    
        return { base: 1, sm: 2, md: 2, lg: 3 };
      default:
        return { base: 1, sm: 2, md: 3, lg: 4 };
    }
  };
  
  const getImageHeight = () => {
    switch (gridSize) {
      case 'small':  
        return '200px';
      case 'medium':   
        return '300px';
      case 'large':  
        return '400px';
      default:
        return '300px';
    }
  };

 // Grid 
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
    <SimpleGrid 
      columns={getGridColumns()} 
      spacing={6} 
      width="100%"
    >
      {filteredPhotos.map((photo, index) => (
        <Box
          key={photo.filename}
          position="relative"
          width="100%"
          height="300px"
          cursor="pointer"
          onClick={() => isSelectionMode ? togglePhotoSelection(photo) : handlePhotoClick(photo, index)}
          role="group"
          borderRadius="lg"
          overflow="hidden"
          transition="all 0.2s"
          _hover={{ 
            transform: 'scale(1.02)',
            boxShadow: 'xl'
          }}
          bg={bgColor}
          boxShadow="base"
          border={isSelectionMode && selectedPhotos.has(photo.filename) ? '3px solid' : '1px solid'}
          borderColor={isSelectionMode && selectedPhotos.has(photo.filename) ? 'blue.500' : borderColor}
        >
          <Image
            src={photoService.getPhotoUrl(photo.year, photo.filename)}
            alt={photo.description || 'Fotoğraf'}
            width="100%"
            height="100%"
            objectFit="cover"
            loading="lazy"
          />
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="blackAlpha.700"
            p={3}
            transform="translateY(100%)"
            transition="transform 0.2s"
            _groupHover={{ transform: 'translateY(0)' }}
          >
            <Text color="white" fontSize="sm">
              {format(new Date(photo.uploadDate), 'dd MMMM yyyy', { locale: tr })}
            </Text>
            {photo.description && (
              <Text color="white" fontSize="sm" noOfLines={1} mt={1}>
                {photo.description}
              </Text>
            )}
          </Box>
        </Box>
      ))}
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
      {filteredPhotos.map((photo, index) => (
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
  const groupedPhotos = filteredPhotos.reduce<Record<string, Photo[]>>((groups, photo) => {
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

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (filteredPhotos.length === 0) {
    return (
      <Center h="200px">
        <Text color={textColor}>Henüz fotoğraf yüklenmemiş</Text>
      </Center>
    );
  }

  


  const renderCalendarView = () => {
    const groupedByMonth = filteredPhotos.reduce<Record<string, Photo[]>>((acc, photo) => {
      const date = new Date(photo.uploadDate);
      const monthKey = format(date, 'MMMM yyyy', { locale: tr });
      
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(photo);
      return acc;
    }, {});
    
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
          const groupedByYear = filteredPhotos.reduce<Record<number, Record<string, Photo[]>>>((acc: Record<number, Record<string, Photo[]>>, photo: Photo) => {
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
    const groupedByUser = filteredPhotos.reduce<Record<string, { userName: string; photos: Photo[] }>>((acc, photo) => {
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
  const renderPhotoModal = () => (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
    <ModalOverlay />
    <ModalContent bg={bgColor}>
      <ModalHeader color={textColor}>
        {selectedPhoto?.description || 'Fotoğraf Detay'}
      </ModalHeader>
      <ModalCloseButton color={textColor} />
      <ModalBody pb={6}>
        {selectedPhoto && (
          <VStack spacing={4}>
                 <Box position="relative" width="100%" height="600px">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <Box position="absolute" top={2} right={2} zIndex={10}>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Zoom in"
                          icon={<AddIcon />}
                          onClick={() => zoomIn()}
                          colorScheme="blue"
                          size="sm"
                        />
                        <IconButton
                          aria-label="Zoom out"
                          icon={<MinusIcon />}
                          onClick={() => zoomOut()}
                          colorScheme="blue"
                          size="sm"
                        />
                        <IconButton
                          aria-label="Reset zoom"
                          icon={<RepeatIcon />}
                          onClick={() => resetTransform()}
                          colorScheme="blue"
                          size="sm"
                        />
                      </HStack>
                    </Box>
                    <TransformComponent>
                      <Image
                        src={photoService.getPhotoUrl(selectedPhoto.year, selectedPhoto.filename)}
                        alt={selectedPhoto.description || 'Fotoğraf'}
                        maxH="600px"
                        maxW="100%"
                        objectFit="contain"
                        draggable={false}
                        margin="0 auto"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>

              {/* Gezinme Butonları */}
              <HStack 
                position="absolute" 
                width="100%" 
                justify="space-between" 
                top="50%" 
                transform="translateY(-50%)"
                px={4}
                pointerEvents="none"
              >
                <IconButton
                  aria-label="Önceki fotoğraf"
                  icon={<ChevronLeftIcon boxSize={8} />}
                  onClick={handlePrevPhoto}
                  isDisabled={selectedPhotoIndex === 0}
                  colorScheme="blue"
                  variant="solid"
                  opacity={0.8}
                  pointerEvents="auto"
                />
                <IconButton
                  aria-label="Sonraki fotoğraf"
                  icon={<ChevronRightIcon boxSize={8} />}
                  onClick={handleNextPhoto}
                  isDisabled={selectedPhotoIndex === filteredPhotos.length - 1}
                  colorScheme="blue"
                  variant="solid"
                  opacity={0.8}
                  pointerEvents="auto"
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
                        Tarih: {format(new Date(selectedPhoto.uploadDate), 'dd MMMM yyyy', { locale: tr })}
                      </Text>
                    </Box>
                    {currentUser && currentUser.uid === selectedPhoto.userId && (
                      <HStack>
                        <IconButton
                          aria-label="Fotoğrafı düzenle"
                          icon={editMode ? <CheckIcon /> : <EditIcon />}
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => {
                            if (editMode) {
                              handleEditSave();
                            } else {
                              setEditData({
                                description: selectedPhoto.description || '',
                                people: selectedPhoto.people || []
                              });
                              setEditMode(true);
                            }
                          }}
                        />
                        <IconButton
                          aria-label="Fotoğrafı sil"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => setIsDeleteOpen(true)}
                        />
                      </HStack>
                    )}
                  </HStack>

                  {editMode ? (
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel color={textColor}>Açıklama</FormLabel>
                        <Input
                          value={editData.description}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          placeholder="Fotoğraf açıklaması"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color={textColor}>Kişiler</FormLabel>
                        <HStack>
                          <Input
                            value={newPerson}
                            onChange={(e) => setNewPerson(e.target.value)}
                            placeholder="Kişi adı"
                          />
                          <IconButton
                            aria-label="Kişi ekle"
                            icon={<AddIcon />}
                            onClick={() => {
                              if (newPerson.trim()) {
                                setEditData(prev => ({
                                  ...prev,
                                  people: [...prev.people, newPerson.trim()]
                                }));
                                setNewPerson('');
                              }
                            }}
                          />
                        </HStack>
                        <Wrap mt={2}>
                          {editData.people.map((person, index) => (
                            <WrapItem key={index}>
                              <Tag colorScheme="blue" borderRadius="full">
                                <TagLabel>{person}</TagLabel>
                                <TagCloseButton
                                  onClick={() => {
                                    setEditData(prev => ({
                                      ...prev,
                                      people: prev.people.filter((_, i) => i !== index)
                                    }));
                                  }}
                                />
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </FormControl>
                    </VStack>
                  ) : (
                    <>
                      {selectedPhoto.description && (
                        <Text mt={2} color={textColor}>{selectedPhoto.description}</Text>
                      )}
                      {selectedPhoto.people && selectedPhoto.people.length > 0 && (
                        <Box mt={4}>
                          <Text fontWeight="bold" color={textColor} mb={2}>
                            Etiketlenen Kişiler:
                          </Text>
                          <Wrap>
                            {selectedPhoto.people.map((person, index) => (
                              <WrapItem key={index}>
                                <Tag colorScheme="blue" variant="subtle">
                                  {person}
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Box>
                      )}
                    </>
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
  );

  return (
    <>
          {viewMode === 'grid' && renderGridView()}
    {viewMode === 'list' && renderListView()}
    {viewMode === 'timeline' && renderTimelineView()}
    {viewMode === 'calendar' && renderCalendarView()}
    {viewMode === 'yearMonth' && renderYearMonthView()}
    {viewMode === 'users' && renderUsersView()}
    {renderPhotoModal()}

     
      

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
});  