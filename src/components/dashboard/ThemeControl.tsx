import React from 'react';
import {
  Box,
  ButtonGroup,
  IconButton,
  Tooltip,
  Select,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  ViewIcon,
  TimeIcon,
  CalendarIcon,
  MoonIcon,
  SunIcon,
  AtSignIcon,
  
} from '@chakra-ui/icons';
import { FiUsers } from 'react-icons/fi'; // react-icons'dan users ikonu
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeControls = () => {
  const {
    viewMode,
    gridSize,
    setViewMode,
    setGridSize,
    toggleColorMode,
    colorMode,
  } = useTheme();

  const bgColor = useColorModeValue('white', 'gray.800');
  const buttonBgColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box bg={bgColor} p={4} borderRadius="lg" shadow="sm">
      <HStack spacing={4} justify="space-between">
        <ButtonGroup size="sm" isAttached variant="outline">
          <Tooltip label="Grid Görünümü">
            <IconButton
              aria-label="Grid view"
              icon={<ViewIcon />}
              isActive={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              bg={viewMode === 'grid' ? buttonBgColor : undefined}
            />
          </Tooltip>
          <Tooltip label="Liste Görünümü">
            <IconButton
              aria-label="List view"
              icon={<ViewIcon />}
              isActive={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              bg={viewMode === 'list' ? buttonBgColor : undefined}
            />
          </Tooltip>
          <Tooltip label="Zaman Çizelgesi">
            <IconButton
              aria-label="Timeline view"
              icon={<TimeIcon />}
              isActive={viewMode === 'timeline'}
              onClick={() => setViewMode('timeline')}
              bg={viewMode === 'timeline' ? buttonBgColor : undefined}
            />
          </Tooltip>
          <Tooltip label="Takvim Görünümü">
            <IconButton
              aria-label="Calendar view"
              icon={<CalendarIcon />}
              isActive={viewMode === 'calendar'}
              onClick={() => setViewMode('calendar')}
              bg={viewMode === 'calendar' ? buttonBgColor : undefined}
            />
          </Tooltip>
          <Tooltip label="Kişilere Göre">
            <IconButton
              aria-label="Users view"
              icon={<FiUsers />}
              isActive={viewMode === 'users'}
              onClick={() => setViewMode('users')}
              bg={viewMode === 'users' ? buttonBgColor : undefined}
            />
          </Tooltip>
        </ButtonGroup>

        {viewMode === 'grid' && (
          <Select
            size="sm"
            value={gridSize}
            onChange={(e) => setGridSize(e.target.value as 'small' | 'medium' | 'large')}
            width="auto"
          >
            <option value="small">Küçük</option>
            <option value="medium">Orta</option>
            <option value="large">Büyük</option>
          </Select>
        )}

        <Tooltip label={`${colorMode === 'light' ? 'Koyu' : 'Açık'} temaya geç`}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="sm"
          />
        </Tooltip>
      </HStack>
    </Box>
  );
};