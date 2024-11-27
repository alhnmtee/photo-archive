// src/components/dashboard/DashboardSidebar.tsx
import {
    VStack,
    Heading,
    Checkbox,
    Box,
    Input,
    InputGroup,
    InputLeftElement,
  } from '@chakra-ui/react';
  import { SearchIcon } from '@chakra-ui/icons';
  
  export const DashboardSidebar = () => {
    const years = Array.from(
      { length: new Date().getFullYear() - 1999 },
      (_, i) => new Date().getFullYear() - i
    );
  
    return (
      <VStack align="stretch" spacing={6}>
        {/* Arama */}
        <Box>
          <Heading size="sm" mb={4}>
            Ara
          </Heading>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input placeholder="Fotoğraflarda ara..." />
          </InputGroup>
        </Box>
  
        {/* Yıl Filtreleme */}
        <Box>
          <Heading size="sm" mb={4}>
            Yıllar
          </Heading>
          <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
            {years.map((year) => (
              <Checkbox key={year}>
                {year}
              </Checkbox>
            ))}
          </VStack>
        </Box>
      </VStack>
    );
  };