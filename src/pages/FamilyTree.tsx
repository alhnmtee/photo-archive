import { Container, Box } from '@chakra-ui/react';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import SimpleFamilyTree from '../components/SimpleFamilyTree';

export const FamilyTreePage = () => {
  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <Box height="calc(100vh - 250px)" width="100%">
          <SimpleFamilyTree />
        </Box>
      </Container>
    </DashboardLayout>
  );
};