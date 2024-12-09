import React, { useCallback, useEffect, useState } from 'react';
import { Box, Avatar, Text, VStack, useColorModeValue, Spinner } from '@chakra-ui/react';
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

const FamilyTreeComponent: React.FC<FamilyTreeProps> = ({
  members,
  connections,
  onMemberClick,
  rootMemberId
}) => {
  const [treeNodes, setTreeNodes] = useState<FamilyTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const calculateLayout = useCallback(() => {
    const nodes: FamilyTreeNode[] = [];
    const memberMap = new Map(members.map(m => [m.id, m]));
    
    const processNode = (memberId: string, level: number, position: number) => {
      const member = memberMap.get(memberId);
      if (!member) return null;

      const node: FamilyTreeNode = {
        ...member,
        level,
        x: position * NODE_WIDTH,
        y: level * LEVEL_HEIGHT,
        layout: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT
        }
      };

      nodes.push(node);

      // Process parents
      if (member.parents) {
        if (member.parents.fatherId) {
          processNode(member.parents.fatherId, level - 1, position - 0.5);
        }
        if (member.parents.motherId) {
          processNode(member.parents.motherId, level - 1, position + 0.5);
        }
      }

      // Process children
      if (member.children) {
        member.children.forEach((childId, index) => {
          processNode(childId, level + 1, position + index - (member.children!.length - 1) / 2);
        });
      }
    };

    processNode(rootMemberId, 0, 0);
    return nodes;
  }, [members, rootMemberId]);

  useEffect(() => {
    setLoading(true);
    const nodes = calculateLayout();
    setTreeNodes(nodes);
    setLoading(false);
  }, [calculateLayout]);

  if (loading) {
    return <Spinner />;
  }

  const renderConnections = () => {
    return connections.map(connection => {
      const fromNode = treeNodes.find(n => n.id === connection.from);
      const toNode = treeNodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;

      const startX = fromNode.x + NODE_WIDTH / 2;
      const startY = fromNode.y + NODE_HEIGHT;
      const endX = toNode.x + NODE_WIDTH / 2;
      const endY = toNode.y;

      return (
        <path
          key={connection.id}
          d={`M ${startX} ${startY} C ${startX} ${(startY + endY) / 2}, ${endX} ${(startY + endY) / 2}, ${endX} ${endY}`}
          stroke={connection.type === 'spouse' ? '#E53E3E' : '#3182CE'}
          strokeWidth="2"
          fill="none"
        />
      );
    });
  };

  return (
    <Box overflowX="auto" overflowY="auto" p={8}>
      <svg width="100%" height="100%" style={{ minWidth: '1000px', minHeight: '600px' }}>
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

export default FamilyTreeComponent;