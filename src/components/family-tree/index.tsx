import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { FamilyMember, FamilyConnection, FamilyTreeNode } from '../../types/familyTree';

interface FamilyTreeProps {
  members: FamilyMember[];
  connections: FamilyConnection[];
  onMemberClick?: (member: FamilyMember) => void;
  rootMemberId: string;
}

const LEVEL_HEIGHT = 120;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

const FamilyTree: React.FC<FamilyTreeProps> = ({
  members,
  connections,
  onMemberClick,
  rootMemberId
}) => {
  const [treeNodes, setTreeNodes] = useState<FamilyTreeNode[]>([]);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const calculateLayout = useCallback(() => {
    console.log("Starting layout calculation with members:", members);
    const nodes: FamilyTreeNode[] = [];
    const processedIds = new Set<string>();
    const memberMap = new Map(members.map(m => [m.id, m]));

    const processNode = (memberId: string, level: number, position: number) => {
      // Prevent infinite recursion
      if (processedIds.has(memberId)) {
        return;
      }

      const member = memberMap.get(memberId);
      if (!member) {
        return;
      }

      processedIds.add(memberId);

      const node: FamilyTreeNode = {
        ...member,
        level,
        x: position * NODE_WIDTH * 1.5,
        y: level * LEVEL_HEIGHT,
        layout: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT
        }
      };

      nodes.push(node);

      // Process parents with offset
      if (member.parents) {
        if (member.parents.fatherId && !processedIds.has(member.parents.fatherId)) {
          processNode(member.parents.fatherId, level - 1, position - 1);
        }
        if (member.parents.motherId && !processedIds.has(member.parents.motherId)) {
          processNode(member.parents.motherId, level - 1, position + 1);
        }
      }

      // Find and process children
      const childrenIds = members
        .filter(m => m.parents?.fatherId === memberId || m.parents?.motherId === memberId)
        .map(m => m.id);

      childrenIds.forEach((childId, index) => {
        if (!processedIds.has(childId)) {
          const offset = index - (childrenIds.length - 1) / 2;
          processNode(childId, level + 1, position + offset);
        }
      });
    };

    // Start with root member
    const rootMember = members.find(m => m.id === rootMemberId) || members[0];
    if (rootMember) {
      processNode(rootMember.id, 0, 0);
    }

    console.log("Calculated nodes:", nodes);
    return nodes;
  }, [members, rootMemberId]);

  useEffect(() => {
    const nodes = calculateLayout();
    setTreeNodes(nodes);
  }, [calculateLayout]);

  const renderConnections = useCallback(() => {
    return connections.map(connection => {
      const fromNode = treeNodes.find(n => n.id === connection.from);
      const toNode = treeNodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;

      const startX = fromNode.x + NODE_WIDTH / 2;
      const startY = fromNode.y + NODE_HEIGHT;
      const endX = toNode.x + NODE_WIDTH / 2;
      const endY = toNode.y;

      const controlY = (startY + endY) / 2;

      return (
        <path
          key={connection.id}
          d={`M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`}
          stroke={connection.type === 'spouse' ? '#E53E3E' : '#3182CE'}
          strokeWidth="2"
          fill="none"
        />
      );
    });
  }, [connections, treeNodes]);

  return (
    <Box position="relative" width="100%" height="100%" overflow="auto">
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minWidth: '1000px',
          minHeight: '600px'
        }}
      >
        <g>{renderConnections()}</g>
      </svg>
      
      {treeNodes.map(node => (
        <Box
          key={node.id}
          position="absolute"
          left={node.x}
          top={node.y}
          width={NODE_WIDTH}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={4}
          cursor="pointer"
          onClick={() => onMemberClick?.(node)}
          _hover={{ transform: 'scale(1.02)' }}
          transition="all 0.2s"
          zIndex={1}
        >
          <VStack spacing={2}>
            <Avatar
              size="md"
              name={node.fullName}
              src={node.photoURL}
              bg={node.gender === 'male' ? 'blue.500' : 'pink.500'}
            />
            <Text fontWeight="bold" fontSize="sm" textAlign="center">
              {node.fullName}
            </Text>
            {node.birthDate && (
              <Text fontSize="xs" color="gray.500">
                {new Date(node.birthDate).getFullYear()}
                {node.deathDate && ` - ${new Date(node.deathDate).getFullYear()}`}
              </Text>
            )}
          </VStack>
        </Box>
      ))}
    </Box>
  );
};

export default FamilyTree;