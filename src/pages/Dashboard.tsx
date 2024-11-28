// src/pages/Dashboard.tsx
import { 
  Box, 
  Button, 
  Heading, 
  HStack, 
  useDisclosure 
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { PhotoGrid } from '../components/dashboard/PhotoGrid';
import { PhotoUploadModal } from '../components/dashboard/PhotoUploadModel';
import { useState } from 'react';

export const Dashboard = () => {
  const { 
    isOpen: isUploadOpen, 
    onOpen: onUploadOpen, 
    onClose: onUploadClose 
  } = useDisclosure();

  const [shouldRefreshGrid, setShouldRefreshGrid] = useState(false);

  const handleUploadSuccess = () => {
    setShouldRefreshGrid(true);
  };

  const handleGridRefreshed = () => {
    setShouldRefreshGrid(false);
  };

  return (
    <DashboardLayout>
      <Box>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg">Fotoğraflar</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onUploadOpen}
          >
            Fotoğraf Yükle
          </Button>
        </HStack>

        <PhotoGrid 
          key={shouldRefreshGrid ? 'refresh' : 'normal'} 
          onGridRefreshed={handleGridRefreshed}
        />

        <PhotoUploadModal 
          isOpen={isUploadOpen} 
          onClose={onUploadClose}
          onUploadSuccess={handleUploadSuccess}
        />
      </Box>
    </DashboardLayout>
  );
};