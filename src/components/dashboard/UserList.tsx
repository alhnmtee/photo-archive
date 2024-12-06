import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  VStack,
  Box,
  Avatar,
  Text,
  HStack,
  useColorModeValue,
  Link as ChakraLink,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import debounce from 'lodash/debounce';

interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

export const UserList = React.memo(() => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const scrollThumbColor = useColorModeValue('gray.300', 'gray.600');

  // React Query ile veri çekme
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
    staleTime: 5 * 60 * 1000
  });

  // Arama işlemini debounce et
  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Filtrelenmiş kullanıcı listesini memorize et
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (isLoading) {
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
          onChange={(e) => debouncedSearch(e.target.value)}
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
});

UserList.displayName = 'UserList';