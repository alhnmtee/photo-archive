// src/components/dashboard/PhotoComments.tsx
import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Avatar,
  Text,
  Input,
  IconButton,
  useColorModeValue,
  Spinner,
  Button
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { commentService, Comment } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PhotoCommentsProps {
  photoId: string;
}

export const PhotoComments: React.FC<PhotoCommentsProps> = ({ photoId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    loadComments();
  }, [photoId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await commentService.getComments(photoId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser || !newComment.trim()) return;

    try {
      setSubmitting(true);
      await commentService.addComment(photoId, newComment, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonim',
        userPhotoURL: currentUser.photoURL || undefined
      });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      await commentService.deleteComment(commentId, currentUser.uid);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner />
      </Box>
    );
  }

  return (
    <VStack spacing={4} w="100%" align="stretch">
      {/* Yeni yorum ekleme */}
      <HStack spacing={3}>
        <Avatar
          size="sm"
          name={currentUser?.displayName || 'Anonim'}
          src={currentUser?.photoURL || undefined}
        />
        <Input
          placeholder="Yorum yaz..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          bg={bgColor}
          borderColor={borderColor}
        />
        <Button
          colorScheme="blue"
          size="sm"
          onClick={handleSubmitComment}
          isLoading={submitting}
          isDisabled={!newComment.trim()}
        >
          Gönder
        </Button>
      </HStack>

      {/* Yorumlar listesi */}
      <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
        {comments.map((comment) => (
          <Box
            key={comment.id}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
            bg={bgColor}
          >
            <HStack justify="space-between" mb={2}>
              <HStack>
                <Avatar
                  size="sm"
                  name={comment.userName}
                  src={comment.userPhotoURL}
                />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">
                    {comment.userName}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    {format(new Date(comment.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                  </Text>
                </Box>
              </HStack>
              {currentUser?.uid === comment.userId && (
                <IconButton
                  aria-label="Yorumu sil"
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDeleteComment(comment.id)}
                />
              )}
            </HStack>
            <Text ml={12}>{comment.content}</Text>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};