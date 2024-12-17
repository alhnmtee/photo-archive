import React from 'react';
import { Box, VStack, HStack, Text, useColorModeValue } from '@chakra-ui/react';

interface FamilyMember {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  generation: number;
  position: number;
  birthDate: string;
  parents?: string[];
  children?: string[];
  displayInitial: string;
}

const SimpleFamilyTree: React.FC = () => {
  const familyData: { members: FamilyMember[] } = {
    members: [
      // Nesil 0
      { id: 'ilgin', fullName: 'Ilgın Kolenoğlu', gender: 'male', generation: 0, position: 0, birthDate: '1940-02-12', children: ['fatma', 'leyla', 'ilkay', 'hakan', 'ramiz'], displayInitial: 'I' },
      { id: 'aynur', fullName: 'Aynur Kolenoğlu', gender: 'female', generation: 0, position: 1, birthDate: '1940-02-12', children: ['fatma', 'leyla', 'ilkay', 'hakan', 'ramiz'], displayInitial: 'A' },

      // Nesil 1
      { id: 'fatma', fullName: 'Fatma Mete', gender: 'female', generation: 1, position: 0, birthDate: '1969-02-12', parents: ['ilgin', 'aynur'], children: ['asim', 'alihan'], displayInitial: 'F' },
      { id: 'leyla', fullName: 'Leyla Yılmaz', gender: 'female', generation: 1, position: 1, birthDate: '1970-02-12', parents: ['ilgin', 'aynur'], children: ['serif', 'betul', 'aysenur'], displayInitial: 'L' },
      { id: 'ilkay', fullName: 'İlkay Kolenoğlu', gender: 'male', generation: 1, position: 2, birthDate: '1975-02-12', parents: ['ilgin', 'aynur'], children: ['ilkincem', 'goktugefe'], displayInitial: 'İ' },
      { id: 'hakan', fullName: 'Hakan Kolenoğlu', gender: 'male', generation: 1, position: 3, birthDate: '1977-02-12', parents: ['ilgin', 'aynur'], displayInitial: 'H' },
      { id: 'ramiz', fullName: 'Ramiz Kolenoğlu', gender: 'male', generation: 1, position: 4, birthDate: '1980-02-12', parents: ['ilgin', 'aynur'], children: ['tuana'], displayInitial: 'R' },

      // Nesil 2 - Fatma'nın Çocukları
      { id: 'asim', fullName: 'Asım Mete', gender: 'male', generation: 2, position: 0, birthDate: '2000-06-25', parents: ['fatma'], displayInitial: 'A' },
      { id: 'alihan', fullName: 'Alihan Mete', gender: 'male', generation: 2, position: 1, birthDate: '2002-05-17', parents: ['fatma'], displayInitial: 'A' },

      // Nesil 2 - Leyla'nın Çocukları
      { id: 'serif', fullName: 'Şerif Burak Yılmaz', gender: 'male', generation: 2, position: 2, birthDate: '1998-04-11', parents: ['leyla'], displayInitial: 'Ş' },
      { id: 'betul', fullName: 'Betül Yılmaz', gender: 'female', generation: 2, position: 3, birthDate: '2003-08-01', parents: ['leyla'], displayInitial: 'B' },
      { id: 'aysenur', fullName: 'Ayşenur Yılmaz', gender: 'female', generation: 2, position: 4, birthDate: '2016-03-03', parents: ['leyla'], displayInitial: 'A' },

      // Nesil 2 - İlkay'ın Çocukları
      { id: 'ilkincem', fullName: 'İlkin Cem Kolenoğlu', gender: 'male', generation: 2, position: 5, birthDate: '2010-01-01', parents: ['ilkay'], displayInitial: 'İ' },
      { id: 'goktugefe', fullName: 'Göktuğ Efe Kolenoğlu', gender: 'male', generation: 2, position: 6, birthDate: '2012-01-01', parents: ['ilkay'], displayInitial: 'G' },

      // Nesil 2 - Ramiz'in Çocukları
      { id: 'tuana', fullName: 'Tuana Kolenoğlu', gender: 'female', generation: 2, position: 7, birthDate: '2015-01-01', parents: ['ramiz'], displayInitial: 'T' },
    ],
  };

  const membersById = React.useMemo(() => {
    return familyData.members.reduce<Record<string, FamilyMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, []);

  const genderColor = (gender: 'male' | 'female'): string =>
    gender === 'male' ? 'blue.300' : 'pink.300';

  const renderMemberCard = (member: FamilyMember) => (
    <Box
      key={member.id}
      bg={useColorModeValue('white', 'gray.700')}
      borderRadius="lg"
      boxShadow="md"
      p={4}
      minW="150px"
      textAlign="center"
      border="2px solid"
      borderColor={genderColor(member.gender)}
    >
      <Text fontSize="2xl" fontWeight="bold" mb={2}>
        {member.displayInitial}
      </Text>
      <Text fontSize="lg">{member.fullName}</Text>
      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
        
      </Text>
    </Box>
  );

  return (
    <VStack
      spacing={8}
      p={8}
      bg={useColorModeValue('gray.100', 'gray.800')}
      minH="100vh"
      align="center"
    >
      {/* Nesil 0 */}
      <HStack spacing={8}>
        {familyData.members
          .filter((member) => member.generation === 0)
          .map((member) => renderMemberCard(member))}
      </HStack>

      {/* Nesil 1 ve Çocukları */}
      <HStack spacing={8} alignItems="flex-start">
        {familyData.members
          .filter((member) => member.generation === 1)
          .map((parent) => (
            <VStack key={parent.id} spacing={4}>
              {renderMemberCard(parent)}
              {parent.children && parent.children.length > 0 && (
                <VStack spacing={4}>
                  {parent.children.map((childId) => {
                    const child = membersById[childId];
                    return child ? renderMemberCard(child) : null;
                  })}
                </VStack>
              )}
            </VStack>
          ))}
      </HStack>
    </VStack>
  );
};

export default SimpleFamilyTree;