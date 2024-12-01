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
  WrapItem
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { photoService } from '../../services/photoService';

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
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILES = 20;

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

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Desteklenmeyen dosya formatı';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Dosya boyutu çok büyük (max 10MB)';
    }
    return null;
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
    if (files.length + newFiles.length > MAX_FILES) {
      toast({
        title: 'Uyarı',
        description: `En fazla ${MAX_FILES} fotoğraf yükleyebilirsiniz`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      newFiles = newFiles.slice(0, MAX_FILES - files.length);
    }

    const processedFiles: UploadFile[] = [];
    
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Hata',
          description: `${file.name}: ${error}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        continue;
      }

      try {
        const preview = await createPreview(file);
        processedFiles.push({
          file,
          preview,
          progress: 0,
          status: 'waiting'
        });
      } catch (error) {
        console.error('Preview creation error:', error);
        toast({
          title: 'Hata',
          description: `${file.name} önizlemesi oluşturulamadı`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }

    setFiles(prev => [...prev, ...processedFiles]);
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
              year: parseInt(year),
              description: description || `Fotoğraf ${index + 1}`,
              userId: currentUser.uid,
              userName: currentUser.displayName || 'Anonim'
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