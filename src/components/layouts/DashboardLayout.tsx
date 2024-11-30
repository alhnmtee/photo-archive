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
  useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { DashboardSidebar } from '../dashboard/DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box minH="100vh" bg={bgColor}>
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
            color={useColorModeValue('gray.800', 'white')}
          />
          
          <Drawer
            isOpen={isOpen}
            placement="left"
            onClose={onClose}
          >
            <DrawerOverlay />
            <DrawerContent bg={useColorModeValue('white', 'gray.800')}>
              <DrawerCloseButton color={useColorModeValue('gray.800', 'white')} />
              <DrawerHeader color={useColorModeValue('gray.800', 'white')}>
                Filtreler
              </DrawerHeader>
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