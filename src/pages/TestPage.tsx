// src/pages/TestPage.tsx
import { useState } from 'react';
import { Box, Button, Container, VStack, useDisclosure } from '@chakra-ui/react';
import { PhotoUploadModal } from '../components/dashboard/PhotoUploadModel';
import { PhotoGrid } from '../components/dashboard/PhotoGrid';

export const TestPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // PhotoGrid'i yeniden yüklemek için state'i güncelle
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Button colorScheme="blue" onClick={onOpen}>
            Fotoğraf Yükle
          </Button>
        </Box>

        {/* Tüm fotoğrafları göster */}
        <PhotoGrid key={refreshTrigger} />

        <PhotoUploadModal
          isOpen={isOpen}
          onClose={onClose}
          onUploadSuccess={handleUploadSuccess}
        />
      </VStack>
    </Container>
  );
};