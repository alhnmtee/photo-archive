import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  IconButton,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem,
  Tag,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Button,
  Textarea,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon, MinusIcon, RepeatIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';

interface PhotoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto: Photo | null;
  photos: Photo[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onEditSave: () => void;
  editMode: boolean;
  editData: {
    description: string;
    people: string[];
  };
  setEditData: React.Dispatch<React.SetStateAction<{
    description: string;
    people: string[];
  }>>;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  newPerson: string;
  setNewPerson: React.Dispatch<React.SetStateAction<string>>;
}
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface Photo {
  year: number;
  filename: string;
  description: string;
  uploadDate: string;
  userName: string;
  people: string[];
}
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PhotoComments } from '../components/dashboard/PhotoComments';
import { photoService } from '../services/photoService';

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  isOpen,
  onClose,
  currentPhoto,
  photos,
  currentIndex,
  onNavigate,
  canEdit,
  onEdit,
  onDelete,
  onEditSave,
  editMode,
  editData,
  setEditData,
  newPerson,
  setNewPerson
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  //const infoBgColor = useColorModeValue('gray.50', 'gray.700');

  const boxBgColor = useColorModeValue('gray.50', 'gray.700');
  //const tagBgColor = useColorModeValue('blue.50', 'blue.900');
  const handleAddPerson = () => {
    if (!newPerson.trim()) return;
    setEditData((prev: { description: string; people: string[]; }) => ({
      ...prev,
      people: [...prev.people, newPerson.trim()]
    }));
    setNewPerson('');
  };

  const handleRemovePerson = (personToRemove: string) => {
    setEditData((prev: { description: string; people: string[]; }) => ({
      ...prev,
      people: prev.people.filter((person: string) => person !== personToRemove)
    }));
  };

  if (!currentPhoto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader color={textColor}>
          {currentPhoto.description || 'Fotoğraf Detay'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Box 
              position="relative" 
              width="800px" 
              height="600px" 
              mx="auto"
            >
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
                      <img
                        src={photoService.getPhotoUrl(currentPhoto.year, currentPhoto.filename)}
                        alt={currentPhoto.description || 'Fotoğraf'}
                        style={{
                          width: '800px',
                          height: '600px',
                          objectFit: 'contain',
                          backgroundColor: 'transparent'
                        }}
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
                  onClick={() => onNavigate(currentIndex - 1)}
                  isDisabled={currentIndex === 0}
                  colorScheme="blue"
                  variant="solid"
                  opacity={0.8}
                  pointerEvents="auto"
                />
                <IconButton
                  aria-label="Sonraki fotoğraf"
                  icon={<ChevronRightIcon boxSize={8} />}
                  onClick={() => onNavigate(currentIndex + 1)}
                  isDisabled={currentIndex === photos.length - 1}
                  colorScheme="blue"
                  variant="solid"
                  opacity={0.8}
                  pointerEvents="auto"
                />
              </HStack>
            </Box>
  
            {/* Fotoğraf Bilgileri */}
            <Box w="100%" p={4} borderRadius="md" bg={boxBgColor}>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Box>
                    <HStack spacing={4}>
                      <Text fontSize="sm" color={textColor}>
                        <Text as="span" fontWeight="bold">Çekildiği Yıl:</Text> {currentPhoto.year}
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        <Text as="span" fontWeight="bold">Yüklenme Tarihi:</Text>{' '}
                        {format(new Date(currentPhoto.uploadDate), 'dd MMMM yyyy', { locale: tr })}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color={textColor} mt={1}>
                      <Text as="span" fontWeight="bold">Yükleyen:</Text> {currentPhoto.userName}
                    </Text>
                  </Box>
                  {canEdit && (
                    <HStack>
                      {!editMode ? (
                        <>
                          <IconButton
                            aria-label="Düzenle"
                            icon={<EditIcon />}
                            onClick={onEdit}
                            variant="ghost"
                          />
                          <IconButton
                            aria-label="Sil"
                            icon={<DeleteIcon />}
                            onClick={onDelete}
                            variant="ghost"
                            colorScheme="red"
                          />
                        </>
                      ) : (
                        <Button colorScheme="blue" onClick={onEditSave}>
                          Kaydet
                        </Button>
                      )}
                    </HStack>
                  )}
                </HStack>
  
                {editMode ? (
                  <VStack spacing={4} align="stretch" mt={4}>
                    <FormControl>
                      <FormLabel>Açıklama</FormLabel>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData((prev: any) => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        placeholder="Fotoğraf hakkında açıklama ekleyin"
                      />
                    </FormControl>
  
                    <FormControl>
                      <FormLabel>Kişiler</FormLabel>
                      <HStack mb={2}>
                        <Input
                          value={newPerson}
                          onChange={(e) => setNewPerson(e.target.value)}
                          placeholder="Kişi adı"
                        />
                        <IconButton
                          aria-label="Kişi ekle"
                          icon={<AddIcon />}
                          onClick={handleAddPerson}
                        />
                      </HStack>
                      <Wrap>
                        {editData.people.map((person: string, index: number) => (
                          <WrapItem key={index}>
                            <Tag size="md" borderRadius="full" variant="solid" colorScheme="blue">
                              <TagLabel>{person}</TagLabel>
                              <TagCloseButton onClick={() => handleRemovePerson(person.toString())} />
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </FormControl>
                  </VStack>
                ) : (
                  <>
                    {currentPhoto.description && (
                      <Text mt={4} color={textColor}>{currentPhoto.description}</Text>
                    )}
  
                    {currentPhoto.people && currentPhoto.people.length > 0 && (
                      <Box mt={4}>
                        <Text fontWeight="bold" color={textColor} mb={2}>
                          Etiketlenen Kişiler:
                        </Text>
                        <Wrap>
                          {currentPhoto.people?.map((person: string, index: number) => (
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
              </VStack>
            </Box>
  
            {/* Yorumlar Bölümü */}
            <Divider my={4} />
            <Box w="100%">
              <Text fontSize="lg" fontWeight="bold" mb={4} color={textColor}>
                Yorumlar
              </Text>
              <PhotoComments photoId={currentPhoto.filename} />
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};