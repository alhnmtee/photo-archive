import React, { useState, useEffect } from 'react';
import {
  VStack,
  Heading,
  Checkbox,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { photoService } from '../../services/photoService';

interface DashboardSidebarProps {
  onFilterChange?: (filters: {
    years: number[];
    people: string[];
    searchQuery: string;
  }) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ onFilterChange }) => {
  const years = Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, i) => new Date().getFullYear() - i
  );

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePeople, setAvailablePeople] = useState<string[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const people = await photoService.getAllPeople();
        setAvailablePeople(people);
      } catch (error) {
        console.error('Error loading people:', error);
      }
    };
    loadPeople();
  }, []);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        years: selectedYears,
        people: selectedPeople,
        searchQuery
      });
    }
  }, [selectedYears, selectedPeople, searchQuery, onFilterChange]);

  const handleYearChange = (year: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedYears([...selectedYears, year]);
    } else {
      setSelectedYears(selectedYears.filter(y => y !== year));
    }
  };

  const handlePersonChange = (person: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPeople([...selectedPeople, person]);
    } else {
      setSelectedPeople(selectedPeople.filter(p => p !== person));
    }
  };

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg={bgColor}
            borderColor={borderColor}
          />
        </InputGroup>
      </Box>

      <Accordion allowMultiple defaultIndex={[0, 1]}>
        {/* Yıl Filtresi */}
        <AccordionItem border="none">
          <AccordionButton px={0}>
            <Box flex="1" textAlign="left">
              <Heading size="sm" color={textColor}>
                Yıllar
              </Heading>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0}>
            <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
              {years.map((year) => (
                <Checkbox 
                  key={year}
                  isChecked={selectedYears.includes(year)}
                  onChange={(e) => handleYearChange(year, e.target.checked)}
                  color={textColor}
                >
                  {year}
                </Checkbox>
              ))}
            </VStack>
          </AccordionPanel>
        </AccordionItem>

        {/* Kişi Filtresi */}
        <AccordionItem border="none">
          <AccordionButton px={0}>
            <Box flex="1" textAlign="left">
              <Heading size="sm" color={textColor}>
                Kişiler
              </Heading>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0}>
            {availablePeople.length > 0 ? (
              <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
                {availablePeople.map((person) => (
                  <Checkbox 
                    key={person}
                    isChecked={selectedPeople.includes(person)}
                    onChange={(e) => handlePersonChange(person, e.target.checked)}
                    color={textColor}
                  >
                    {person}
                  </Checkbox>
                ))}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">
                Henüz kişi etiketi eklenmemiş
              </Text>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Seçili Filtreler Özeti */}
      {(selectedYears.length > 0 || selectedPeople.length > 0) && (
        <Box>
          <Heading size="sm" mb={2} color={textColor}>
            Aktif Filtreler
          </Heading>
          {selectedYears.length > 0 && (
            <Text fontSize="sm" color="gray.500">
              {selectedYears.length} yıl seçili
            </Text>
          )}
          {selectedPeople.length > 0 && (
            <Text fontSize="sm" color="gray.500">
              {selectedPeople.length} kişi seçili
            </Text>
          )}
        </Box>
      )}
    </VStack>
  );
};