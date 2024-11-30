import { 
  Box, 
  Button, 
  Heading, 
  HStack,
  VStack,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { PhotoGrid } from '../components/dashboard/PhotoGrid';
import { PhotoUploadModal } from '../components/dashboard/PhotoUploadModel';
import { ThemeControls } from '../components/dashboard/ThemeControl';
import { useState } from 'react';

export const Dashboard = () => {
  const { 
    isOpen: isUploadOpen, 
    onOpen: onUploadOpen, 
    onClose: onUploadClose 
  } = useDisclosure();

  const [shouldRefreshGrid, setShouldRefreshGrid] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleUploadSuccess = () => {
    setShouldRefreshGrid(true);
  };

  const handleGridRefreshed = () => {
    setShouldRefreshGrid(false);
  };

  return (
    <DashboardLayout>
      <VStack spacing={6} w="full">
        <Box
          w="full"
          bg={bgColor}
          p={4}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <HStack justify="space-between" mb={6}>
            <Heading size="lg" color={textColor}>
              Fotoğraflar
            </Heading>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onUploadOpen}
            >
              Fotoğraf Yükle
            </Button>
          </HStack>

          <ThemeControls />
        </Box>

        <Box w="full">
          <PhotoGrid 
            key={shouldRefreshGrid ? 'refresh' : 'normal'} 
            onGridRefreshed={handleGridRefreshed}
          />
        </Box>

        <PhotoUploadModal 
          isOpen={isUploadOpen} 
          onClose={onUploadClose}
          onUploadSuccess={handleUploadSuccess}
        />
      </VStack>
    </DashboardLayout>
  );
};