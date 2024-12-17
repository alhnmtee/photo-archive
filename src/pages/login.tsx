import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Divider,
  //Text,
  useToast,
  FormErrorMessage,
  Icon
} from '@chakra-ui/react'
import { FcGoogle } from 'react-icons/fc';
import { BsApple } from 'react-icons/bs';
import { loginSchema, LoginFormData } from '../schemas/auth.schema';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { signInWithEmail, signInWithGoogle, signInWithApple,currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleError = (error: any) => {
    console.error('Login Error Details:', {
      error,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    toast({
      title: 'Giriş başarısız',
      description: error.message,
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
    setLoading(false);
  };

  const onEmailSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      console.log('Starting login process...');
      
      //await new Promise(resolve => setTimeout(resolve, 1000));

      const user = await signInWithEmail(data.email, data.password);
      console.log('Login successful, user:', user);
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
    } catch (error) {
      handleError(error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      handleError(error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
      navigate('/dashboard');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6}>
        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onEmailSubmit)} style={{ width: '100%' }}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type="email" {...register('email')} />
              <FormErrorMessage>
                {errors.email?.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Şifre</FormLabel>
              <Input type="password" {...register('password')} />
              <FormErrorMessage>
                {errors.password?.message}
              </FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={loading}
            >
              Giriş Yap
            </Button>
          </VStack>
        </form>

        <Divider />

        {/* Social Login Buttons */}
        <VStack spacing={4} width="100%">
          <Button
            width="full"
            onClick={handleGoogleSignIn}
            isLoading={loading}
            leftIcon={<Icon as={FcGoogle} />}
            variant="outline"
          >
            Google ile Giriş Yap
          </Button>

          <Button
            width="full"
            onClick={handleAppleSignIn}
            isLoading={loading}
            leftIcon={<Icon as={BsApple} />}
            variant="outline"
            backgroundColor="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
          >
            Apple ile Giriş Yap
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};