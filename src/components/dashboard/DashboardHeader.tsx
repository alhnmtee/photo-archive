import {
  Box,
  Flex,
  Container,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardHeader = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <Box 
      bg={bgColor} 
      boxShadow="sm" 
      position="sticky" 
      top={0} 
      zIndex={10}
      borderBottom="1px"
      borderColor={borderColor}
    >
      <Container maxW="container.xl">
        <Flex h="16" alignItems="center" justifyContent="space-between">
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            cursor="pointer" 
            onClick={() => navigate('/dashboard')}
            color={textColor}
          >
            Aile Fotoğraf Arşivi
          </Text>

          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Avatar size="sm" src={currentUser?.photoURL || undefined} />
            </MenuButton>
            <MenuList bg={bgColor} borderColor={borderColor}>
              <MenuItem 
                onClick={handleProfileClick}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                color={textColor}
              >
                Profil
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                color={textColor}
              >
                Çıkış Yap
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Container>
    </Box>
  );
};