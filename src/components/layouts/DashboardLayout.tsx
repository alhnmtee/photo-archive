// src/components/layouts/DashboardLayout.tsx
import React from 'react';
import {
  Box,
  Flex,
  Container,
  useDisclosure,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { DashboardSidebar } from '../dashboard/DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <DashboardHeader />

      <Container maxW="container.xl" py={5}>
        <Flex>
          {/* Sidebar - Desktop */}
          <Box
            display={{ base: 'none', md: 'block' }}
            w="250px"
            mr={8}
          >
            <DashboardSidebar />
          </Box>

          {/* Sidebar - Mobile */}
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            display={{ base: 'flex', md: 'none' }}
            mb={4}
          />
          
          <Drawer
            isOpen={isOpen}
            placement="left"
            onClose={onClose}
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Filtreler</DrawerHeader>
              <DrawerBody>
                <DashboardSidebar />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Main Content */}
          <Box flex="1">
            {children}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};