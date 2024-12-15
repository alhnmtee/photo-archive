import React from 'react';
import {
  VStack,
  HStack,
  Box,
  Avatar,
  Text,
  Input,
  IconButton,
  Button,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { DeleteIcon, ChatIcon } from '@chakra-ui/icons';
import { commentService } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';

interface PhotoCommentsProps {
  photoId: string;
}

export const PhotoComments: React.FC<PhotoCommentsProps> = ({ photoId }) => {
  // Tüm useColorModeValue hook'larını en üstte topluyoruz
  const colors = {
    bg: useColorModeValue('white', 'gray.800'),
    border: useColorModeValue('gray.200', 'gray.600'),
    text: useColorModeValue('gray.600', 'gray.300'),
    replyBg: useColorModeValue('gray.50', 'gray.700'),
  };

  const { currentUser } = useAuth();

  // State tanımlamalarını bir arada tutuyoruz
  interface Comment {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
    createdAt: string;
    replies?: Reply[];
  }

  interface Reply {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
    createdAt: string;
  }

  interface RepliesState {
    [key: string]: {
      text: string;
      isReplying: boolean;
    };
  }

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [replies, setReplies] = useState<RepliesState>({});

  // useCallback ile fonksiyonları memoize ediyoruz
  const loadComments = useCallback(async () => {
    if (!photoId) return;

    try {
      setLoading(true);
      const fetchedComments = await commentService.getComments(photoId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

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

  const handleReplyChange = (commentId: string, value: string) => {
    setReplies(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        text: value
      }
    }));
  };

  const toggleReply = (commentId: string) => {
    setReplies(prev => ({
      ...prev,
      [commentId]: {
        text: '',
        isReplying: !prev[commentId]?.isReplying
      }
    }));
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!currentUser || !replies[commentId]?.text?.trim()) return;

    try {
      setSubmitting(true);
      await commentService.addReply(
        commentId,
        photoId,
        replies[commentId].text,
        {
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Anonim',
          userPhotoURL: currentUser.photoURL || undefined
        }
      );

      setReplies(prev => ({
        ...prev,
        [commentId]: {
          text: '',
          isReplying: false
        }
      }));

      await loadComments();
    } catch (error) {
      console.error('Error submitting reply:', error);
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

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!currentUser) return;

    try {
      await commentService.deleteReply(commentId, replyId, currentUser.uid, photoId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting reply:', error);
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
          bg={colors.bg}
          borderColor={colors.border}
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

      <VStack spacing={4} align="stretch">
        {comments.map((comment) => (
          <Box
            key={comment.id}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            borderColor={colors.border}
            bg={colors.bg}
          >
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
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
                    <Text fontSize="xs" color={colors.text}>
                      {format(new Date(comment.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </Text>
                  </Box>
                </HStack>
                <HStack>
                  <IconButton
                    aria-label="Yanıtla"
                    icon={<ChatIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleReply(comment.id)}
                  />
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
              </HStack>

              <Text ml={12}>{comment.content}</Text>

              {/* Yanıtlar */}
              {comment.replies?.map((reply) => (
                <Box
                  key={reply.id}
                  ml={12}
                  p={2}
                  borderLeftWidth="2px"
                  borderColor="blue.200"
                  bg={colors.replyBg}
                  borderRadius="md"
                >
                  <HStack justify="space-between">
                    <HStack>
                      <Avatar
                        size="xs"
                        name={reply.userName}
                        src={reply.userPhotoURL}
                      />
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">
                          {reply.userName}
                        </Text>
                        <Text fontSize="xs" color={colors.text}>
                          {format(new Date(reply.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                        </Text>
                      </Box>
                    </HStack>
                    {currentUser?.uid === reply.userId && (
                      <IconButton
                        aria-label="Yanıtı sil"
                        icon={<DeleteIcon />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteReply(comment.id, reply.id)}
                      />
                    )}
                  </HStack>
                  <Text ml={8} mt={1} fontSize="sm">
                    {reply.content}
                  </Text>
                </Box>
              ))}

              {/* Yanıt formu */}
              {replies[comment.id]?.isReplying && (
                <HStack ml={12} spacing={3}>
                  <Avatar
                    size="sm"
                    name={currentUser?.displayName || 'Anonim'}
                    src={currentUser?.photoURL || undefined}
                  />
                  <Input
                    placeholder="Yanıt yaz..."
                    value={replies[comment.id]?.text || ''}
                    onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                    size="sm"
                  />
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleSubmitReply(comment.id)}
                    isDisabled={!replies[comment.id]?.text?.trim()}
                  >
                    Yanıtla
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleReply(comment.id)}
                  >
                    İptal
                  </Button>
                </HStack>
              )}
            </VStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};