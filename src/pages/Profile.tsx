import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  InputGroup,
  InputLeftElement,
  Icon,
  Link,
  FormErrorMessage
} from '@chakra-ui/react';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { PhotoGrid } from '../components/dashboard/PhotoGrid';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { userStatsService } from '../services/userStatsService';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { userService } from '../services/userService';


const Profile = () => {
    const { currentUser } = useAuth();
    const toast = useToast();
    const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
    const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
    const [loading, setLoading] = useState(false);
    const [userStats, setUserStats] = useState<any>(null);
  
    const [profileData, setProfileData] = useState({
      displayName: currentUser?.displayName || '',
      photoURL: currentUser?.photoURL || '',
      email: currentUser?.email || '',
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (currentUser?.uid) {
        try {
          const stats = await userStatsService.getUserStats(currentUser.uid);
          setUserStats(stats);
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    };

    fetchUserStats();
  }, [currentUser]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser?.uid) return;

      try {
        const profile = await userService.getUserProfile(currentUser.uid);
        if (profile) {
          setProfileData({
            displayName: currentUser?.displayName || '',
            photoURL: currentUser?.photoURL || '',
            email: currentUser?.email || '',
            facebook: profile.facebook || '',
            twitter: profile.twitter || '',
            instagram: profile.instagram || '',
            linkedin: profile.linkedin || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Hata',
          description: 'Profil bilgileri yüklenirken bir hata oluştu',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // Stats bilgilerini yükle
  useEffect(() => {
    const fetchUserStats = async () => {
      if (currentUser?.uid) {
        try {
          const stats = await userStatsService.getUserStats(currentUser.uid);
          setUserStats(stats);
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    };

    fetchUserStats();
  }, [currentUser]);

  const handleProfileUpdate = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Önce Firebase Auth profilini güncelle
      await updateProfile(currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });

      // Sonra Firestore'a kaydet
      await userService.setUserProfile(currentUser.uid, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        email: currentUser.email || '',
        facebook: profileData.facebook,
        twitter: profileData.twitter,
        instagram: profileData.instagram,
        linkedin: profileData.linkedin
      });

      toast({
        title: 'Başarılı',
        description: 'Profil başarıyla güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onProfileClose();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Hata',
        description: 'Profil güncellenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentUser || !currentUser.email) return;

    // Validation
    let hasError = false;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Mevcut şifre gerekli';
      hasError = true;
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Yeni şifre gerekli';
      hasError = true;
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Şifre en az 6 karakter olmalı';
      hasError = true;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
      hasError = true;
    }

    if (hasError) {
      setPasswordErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // Kullanıcıyı yeniden doğrula
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Şifreyi güncelle
      await updatePassword(currentUser, passwordData.newPassword);

      toast({
        title: 'Şifre güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onPasswordClose();
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.code === 'auth/wrong-password' 
          ? 'Mevcut şifre yanlış' 
          : 'Şifre güncellenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Profil Bilgileri */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <HStack spacing={6} align="start">
              <Avatar 
                size="2xl" 
                name={currentUser?.displayName || 'Kullanıcı'} 
                src={currentUser?.photoURL || undefined} 
              />
              <VStack align="start" flex={1} spacing={4}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">
                    {currentUser?.displayName || 'İsimsiz Kullanıcı'}
                  </Text>
                  <Text color="gray.600">{currentUser?.email}</Text>
                </Box>
                <HStack>
                  <Button colorScheme="blue" size="sm" onClick={onProfileOpen}>
                    Profili Düzenle
                  </Button>
                  <Button colorScheme="red" size="sm" onClick={onPasswordOpen}>
                    Şifre Değiştir
                  </Button>
                </HStack>
              </VStack>
            </HStack>
          </Box>

          {/* İstatistikler */}
          {userStats && (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                <StatLabel>Toplam Fotoğraf</StatLabel>
                <StatNumber>{userStats.totalPhotos}</StatNumber>
              </Stat>
              <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                <StatLabel>En Aktif Yıl</StatLabel>
                <StatNumber>{userStats.mostActiveYear || '-'}</StatNumber>
                {userStats.mostActiveYear && (
                  <StatHelpText>
                    {userStats.photosByYear[userStats.mostActiveYear]} fotoğraf
                  </StatHelpText>
                )}
              </Stat>
              <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                <StatLabel>Son Yükleme</StatLabel>
                <StatNumber>
                  {userStats.latestUpload 
                    ? new Date(userStats.latestUpload).toLocaleDateString('tr-TR')
                    : '-'}
                </StatNumber>
              </Stat>
            </SimpleGrid>
          )}

          {/* Sosyal Medya Bağlantıları */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Sosyal Medya
            </Text>
            <HStack spacing={4}>
              {profileData.facebook && (
                <Link href={profileData.facebook} isExternal>
                  <Icon as={FaFacebook} boxSize={6} color="blue.600" />
                </Link>
              )}
              {profileData.twitter && (
                <Link href={profileData.twitter} isExternal>
                  <Icon as={FaTwitter} boxSize={6} color="blue.400" />
                </Link>
              )}
              {profileData.instagram && (
                <Link href={profileData.instagram} isExternal>
                  <Icon as={FaInstagram} boxSize={6} color="purple.500" />
                </Link>
              )}
              {profileData.linkedin && (
                <Link href={profileData.linkedin} isExternal>
                  <Icon as={FaLinkedin} boxSize={6} color="blue.700" />
                </Link>
              )}
            </HStack>
          </Box>

          <Divider />

          {/* Kullanıcının Fotoğrafları */}
          <Box>
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              Fotoğraflarım
            </Text>
            <PhotoGrid userId={currentUser?.uid} />
          </Box>
        </VStack>

        {/* Profil Düzenleme Modal */}
        <Modal isOpen={isProfileOpen} onClose={onProfileClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Profili Düzenle</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>İsim</FormLabel>
                  <Input
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      displayName: e.target.value
                    }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Profil Fotoğrafı URL</FormLabel>
                  <Input
                    value={profileData.photoURL}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      photoURL: e.target.value
                    }))}
                  />
                </FormControl>
                <FormControl isReadOnly>
                  <FormLabel>Email</FormLabel>
                  <Input value={profileData.email} bg="gray.50" />
                </FormControl>
                
                {/* Sosyal Medya Bağlantıları */}
                <FormControl>
                  <FormLabel>Facebook</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaFacebook} color="blue.600" />
                    </InputLeftElement>
                    <Input
                      value={profileData.facebook}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        facebook: e.target.value
                      }))}
                      placeholder="Facebook profil URL'i"
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>Twitter</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaTwitter} color="blue.400" />
                    </InputLeftElement>
                    <Input
                      value={profileData.twitter}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        twitter: e.target.value
                      }))}
                      placeholder="Twitter profil URL'i"
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>Instagram</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaInstagram} color="purple.500" />
                    </InputLeftElement>
                    <Input
                      value={profileData.instagram}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        instagram: e.target.value
                      }))}
                      placeholder="Instagram profil URL'i"
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>LinkedIn</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaLinkedin} color="blue.700" />
                    </InputLeftElement>
                    <Input
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        linkedin: e.target.value
                      }))}
                      placeholder="LinkedIn profil URL'i"
                    />
                  </InputGroup>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onProfileClose}>
                İptal
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleProfileUpdate}
                isLoading={loading}
              >
                Kaydet
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Şifre Değiştirme Modal */}
        <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Şifre Değiştir</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isInvalid={!!passwordErrors.currentPassword}>
                  <FormLabel>Mevcut Şifre</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                  />
                  <FormErrorMessage>
                    {passwordErrors.currentPassword}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.newPassword}>
                  <FormLabel>Yeni Şifre</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                  />
                  <FormErrorMessage>
                    {passwordErrors.newPassword}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                  <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                  />
                  <FormErrorMessage>
                    {passwordErrors.confirmPassword}
                  </FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onPasswordClose}>
                İptal
              </Button>
              <Button
                colorScheme="blue"
                onClick={handlePasswordUpdate}
                isLoading={loading}
              >
                Şifreyi Güncelle
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
};
export default Profile;