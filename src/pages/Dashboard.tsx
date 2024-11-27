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


export const Dashboard = () => {
  const { 
    isOpen: isUploadOpen, 
    onOpen: onUploadOpen, 
    onClose: onUploadClose 
  } = useDisclosure();

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

        <PhotoGrid />
      </Box>

     
    </DashboardLayout>
  );
};