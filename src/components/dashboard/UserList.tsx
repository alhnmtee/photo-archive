// src/components/dashboard/UserList.tsx
import React, { useEffect, useState } from 'react';
import {
  VStack,
  Box,
  Avatar,
  Text,
  HStack,
  useColorModeValue,
  Divider,
  Link as ChakraLink,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';

interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

export const UserList = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const scrollThumbColor = useColorModeValue('gray.300', 'gray.600');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await userService.getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4} color={textColor}>
        Üyeler
      </Text>

      <InputGroup mb={4} size="sm">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Üye ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          borderColor={borderColor}
        />
      </InputGroup>

      <VStack
        spacing={2}
        align="stretch"
        maxH="calc(100vh - 200px)"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollThumbColor,
            borderRadius: '24px',
          },
        }}
      >
        {filteredUsers.map((user) => (
          <ChakraLink
            key={user.id}
            as={Link}
            to={`/profile/${user.id}`}
            _hover={{ textDecoration: 'none' }}
          >
            <HStack
              p={2}
              borderRadius="md"
              _hover={{ bg: hoverBg }}
              transition="all 0.2s"
            >
              <Avatar
                size="sm"
                name={user.displayName}
                src={user.photoURL}
              />
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  {user.displayName}
                </Text>
              </Box>
            </HStack>
          </ChakraLink>
        ))}

        {filteredUsers.length === 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            Kullanıcı bulunamadı
          </Text>
        )}
      </VStack>
    </Box>
  );
};