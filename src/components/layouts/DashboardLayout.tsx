import React from 'react';
import {
  Box,
  Flex,
  //Container,
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
import { UserList } from '../dashboard/UserList';

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

      {/* Main Content */}
      <Box w="100%" h="calc(100vh - 64px)" position="relative" overflowY="hidden">
        <Flex h="100%">
          {/* Sol Sidebar */}
          <Box
            w="250px"
            h="100%"
            position="fixed"
            left={0}
            top="64px"
            overflowY="auto"
            bg={useColorModeValue('white', 'gray.800')}
            borderRight="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            display={{ base: 'none', md: 'block' }}
            p={4}
          >
            <DashboardSidebar />
          </Box>

          {/* Mobil Menü */}
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            display={{ base: 'flex', md: 'none' }}
            position="fixed"
            top="70px"
            left={4}
            zIndex={2}
          />
          
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Menu</DrawerHeader>
              <DrawerBody>
                <DashboardSidebar />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Ana İçerik */}
          <Box
            flex={1}
            ml={{ base: 0, md: '250px' }}
            mr={{ base: 0, lg: '300px' }}
            p={4}
            overflowY="auto"
            h="100%"
          >
            {children}
          </Box>

          {/* Sağ Sidebar - UserList */}
          <Box
            w="300px"
            h="100%"
            position="fixed"
            right={0}
            top="64px"
            overflowY="auto"
            bg={useColorModeValue('white', 'gray.800')}
            borderLeft="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            display={{ base: 'none', lg: 'block' }}
            p={4}
          >
            <UserList />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};