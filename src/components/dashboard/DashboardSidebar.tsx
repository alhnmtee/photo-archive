import {
  VStack,
  Heading,
  Checkbox,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

export const DashboardSidebar = () => {
  const years = Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, i) => new Date().getFullYear() - i
  );

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <VStack 
      align="stretch" 
      spacing={6} 
      bg={bgColor} 
      p={4} 
      borderRadius="lg" 
      borderWidth="1px"
      borderColor={borderColor}
    >
      {/* Arama */}
      <Box>
        <Heading size="sm" mb={4} color={textColor}>
          Ara
        </Heading>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input 
            placeholder="Fotoğraflarda ara..." 
            bg={bgColor}
            borderColor={borderColor}
          />
        </InputGroup>
      </Box>

      {/* Yıl Filtreleme */}
      <Box>
        <Heading size="sm" mb={4} color={textColor}>
          Yıllar
        </Heading>
        <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
          {years.map((year) => (
            <Checkbox 
              key={year}
              color={textColor}
            >
              {year}
            </Checkbox>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};