import { useState, useRef, useCallback } from 'react';
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
  useToast,
  SimpleGrid,
  Text,
  HStack,
  IconButton,
  useColorModeValue,
  Flex,
  Tag,
  Wrap,
  WrapItem,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { photoService } from '../../services/photoService';
import imageOptimizer from '../../utils/imageOptimizer';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'success' | 'error';
  error?: string;
  metadata?: {
    originalSize: string;
    optimizedSize: string;
    compressionRatio: string;
    dimensions: string;
  };
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ 
  isOpen, 
  onClose,
  onUploadSuccess 
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { currentUser } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const dragBorderColor = useColorModeValue('blue.500', 'blue.300');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  const createPreview = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (newFiles: File[]) => {
    try {
      const { results, errors } = await imageOptimizer.processFiles(newFiles);
      
      // Hataları bildir
      errors.forEach(({ file, error }) => {
        toast({
          title: `Hata: ${file.name}`,
          description: error,
          status: 'error',
          duration: 3000,
        });
      });
  
      // Başarılı sonuçları işle
      for (const result of results) {
        const preview = await createPreview((result as any).file);
        setFiles(prev => [...prev, {
          file: (result as any).file,
          preview,
          progress: 0,
          status: 'waiting',
          metadata: {
            originalSize: formatFileSize((result as any).originalSize),
            optimizedSize: formatFileSize((result as any).optimizedSize),
            compressionRatio: (result as any).compressionRatio,
            dimensions: `${(result as any).width}x${(result as any).height}`
          }
        }]);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: 'Hata',
        description: 'Dosyalar işlenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      });
    }
  };

   

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    await processFiles(selectedFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');

  const handleAddPerson = () => {
    if (newPerson.trim()) {
      setPeople([...people, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !currentUser || !year) {
      toast({
        title: 'Hata',
        description: 'Lütfen en az bir fotoğraf seçin ve tüm alanları doldurun',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        files.map(async (fileData, index) => {
          if (fileData.status === 'success') return; // Skip already uploaded files

          try {
            setFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, status: 'uploading' } : f
            ));

            // Upload progress simulation
            const progressInterval = setInterval(() => {
              setFiles(prev => prev.map((f, i) => 
                i === index ? { ...f, progress: Math.min((f.progress || 0) + 10, 90) } : f
              ));
            }, 200);

            await photoService.uploadPhoto(fileData.file, {
              filename: fileData.file.name,
              year: parseInt(year),
              description: description || `Fotoğraf ${index + 1}`,
              userId: currentUser.uid,
              userName: currentUser.displayName || 'Anonim',
              uploadDate: '',
              people: people,
              size: fileData.file.size,
              mimetype: fileData.file.type,
              path: fileData.file.name
            });

            clearInterval(progressInterval);
            setFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, progress: 100, status: 'success' } : f
            ));
            successCount++;
          } catch (error) {
            console.error(`Error uploading ${fileData.file.name}:`, error);
            setFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, status: 'error', error: 'Yükleme başarısız' } : f
            ));
            failCount++;
          }
        })
      );

      if (successCount > 0) {
        toast({
          title: 'Yükleme Tamamlandı',
          description: `${successCount} fotoğraf başarıyla yüklendi${failCount > 0 ? `, ${failCount} fotoğraf yüklenemedi` : ''}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onUploadSuccess?.();
        
        // Only close if all files were uploaded successfully
        if (failCount === 0) {
          handleClose();
        }
      } else {
        toast({
          title: 'Yükleme Başarısız',
          description: 'Hiçbir fotoğraf yüklenemedi',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Hata',
        description: 'Fotoğraflar yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setYear(new Date().getFullYear().toString());
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Fotoğraf Yükle</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Box
              border="2px dashed"
              borderColor={dragOver ? dragBorderColor : borderColor}
              borderRadius="md"
              p={6}
              w="100%"
              textAlign="center"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              bg={dragOver ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
              transition="all 0.2s"
            >
              <VStack spacing={2}>
                <AddIcon boxSize={6} color="gray.400" />
                <Text>Fotoğraf seçmek için tıklayın</Text>
                <Text fontSize="sm" color="gray.500">
                  veya sürükleyip bırakın
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Maksimum dosya boyutu: 10MB
                </Text>
                <Wrap justify="center" spacing={2}>
                  {ALLOWED_TYPES.map(type => (
                    <WrapItem key={type}>
                      <Tag size="sm" variant="subtle">
                        {type.split('/')[1].toUpperCase()}
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </VStack>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={ALLOWED_TYPES.join(',')}
                display="none"
                multiple
              />
            </Box>

            {files.length > 0 && (
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4} w="100%">
                {files.map((fileData, index) => (
                  <Box key={index} position="relative">
                    <Image
                      src={fileData.preview}
                      alt={`Preview ${index + 1}`}
                      objectFit="cover"
                      h="120px"
                      w="100%"
                      borderRadius="md"
                      opacity={fileData.status === 'error' ? 0.5 : 1}
                    />
                    <IconButton
                      aria-label="Remove image"
                      icon={<CloseIcon />}
                      size="xs"
                      position="absolute"
                      top={1}
                      right={1}
                      onClick={() => removeFile(index)}
                    />
                    {fileData.status === 'uploading' && (
                      <Progress
                        value={fileData.progress}
                        size="xs"
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        borderRadius="md"
                        colorScheme="blue"
                      />
                    )}
                    {fileData.status === 'success' && (
                      <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        bg="green.500"
                        color="white"
                        fontSize="xs"
                        p={1}
                        textAlign="center"
                      >
                        Yüklendi
                      </Box>
                    )}
                    {fileData.status === 'error' && (
                      <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        bg="red.500"
                        color="white"
                        fontSize="xs"
                        p={1}
                        textAlign="center"
                      >
                        Hata
                      </Box>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            )}

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
                placeholder="Fotoğraflar hakkında açıklama ekleyin"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Fotoğraftaki Kişiler</FormLabel>
              <HStack>
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
              {people.length > 0 && (
                <Wrap mt={2}>
                  {people.map((person, index) => (
                    <WrapItem key={index}>
                      <Tag
                        size="md"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="blue"
                      >
                        <TagLabel>{person}</TagLabel>
                        <TagCloseButton
                          onClick={() => {
                            const newPeople = [...people];
                            newPeople.splice(index, 1);
                            setPeople(newPeople);
                          }}
                        />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Flex justify="space-between" w="100%" align="center">
            <Text fontSize="sm" color="gray.500">
              {files.length} fotoğraf seçildi
              {files.some(f => f.status === 'success') && 
                ` (${files.filter(f => f.status === 'success').length} yüklendi)`}
            </Text>
            <HStack spacing={4}>
              <Button variant="ghost" onClick={handleClose}>
                {files.some(f => f.status === 'success') ? 'Kapat' : 'İptal'}
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleUpload}
                isLoading={uploading}
                loadingText="Yükleniyor..."
                isDisabled={files.length === 0 || files.every(f => f.status === 'success')}
              >
                {files.length > 1 ? 'Tümünü Yükle' : 'Yükle'}
              </Button>
            </HStack>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );  
};
