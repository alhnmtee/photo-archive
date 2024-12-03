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
  FormErrorMessage,
  useColorModeValue
} from '@chakra-ui/react';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { PhotoGrid } from '../components/dashboard/PhotoGrid';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { userStatsService } from '../services/userStatsService';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { userService } from '../services/userService';
import { useParams } from 'react-router-dom';

const Profile = () => {
    // Renk modu değerleri
    const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.600', 'gray.300');
    const headingColor = useColorModeValue('gray.800', 'white');
    const modalBg = useColorModeValue('white', 'gray.800');
    const inputBg = useColorModeValue('white', 'gray.700');
    const disabledInputBg = useColorModeValue('gray.50', 'gray.600');

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
    const { userId: profileUserId } = useParams();

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
      const targetUserId = profileUserId || currentUser?.uid;
      if (!targetUserId) return;

      try {
        const profile = await userService.getUserProfile(targetUserId);
        if (profile) {
          setProfileData({
            displayName: profile.displayName || '',
            photoURL: profile.photoURL || '',
            email: profile.email || '',
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
  }, [profileUserId, currentUser]);

  const isOwnProfile = !profileUserId || profileUserId === currentUser?.uid;

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

  const fetchUserStats = async () => {
    const targetUserId = profileUserId || currentUser?.uid;
    if (!targetUserId) return;
    
    try {
      const stats = await userStatsService.getUserStats(targetUserId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast({
        title: 'Hata',
        description: 'Kullanıcı istatistikleri güncellenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGridRefreshed = () => {
    if (profileUserId || currentUser?.uid) {
      const targetUserId = profileUserId || currentUser?.uid;
      fetchUserStats(); // İstatistikleri güncelle
    }
  };


  return (
    <DashboardLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Profil Bilgileri */}
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <HStack spacing={6} align="start">
              <Avatar 
                size="2xl" 
                name={profileData.displayName} 
                src={profileData.photoURL} 
              />
              <VStack align="start" flex={1} spacing={4}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
                    {profileData.displayName}
                  </Text>
                  <Text color={textColor}>{profileData.email}</Text>
                </Box>
                {isOwnProfile && (
                  <HStack>
                    <Button colorScheme="blue" size="sm" onClick={onProfileOpen}>
                      Profili Düzenle
                    </Button>
                    <Button colorScheme="red" size="sm" onClick={onPasswordOpen}>
                      Şifre Değiştir
                    </Button>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </Box>

          

          {/* İstatistikler */}
          {userStats && (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Stat bg={bgColor} p={4} borderRadius="lg" boxShadow="sm">
                <StatLabel color={textColor}>Toplam Fotoğraf</StatLabel>
                <StatNumber color={headingColor}>{userStats.totalPhotos}</StatNumber>
              </Stat>
              <Stat bg={bgColor} p={4} borderRadius="lg" boxShadow="sm">
                <StatLabel color={textColor}>En Aktif Yıl</StatLabel>
                <StatNumber color={headingColor}>{userStats.mostActiveYear || '-'}</StatNumber>
                {userStats.mostActiveYear && (
                  <StatHelpText color={textColor}>
                    {userStats.photosByYear[userStats.mostActiveYear]} fotoğraf
                  </StatHelpText>
                )}
              </Stat>
              <Stat bg={bgColor} p={4} borderRadius="lg" boxShadow="sm">
                <StatLabel color={textColor}>Son Yükleme</StatLabel>
                <StatNumber color={headingColor}>
                  {userStats.latestUpload 
                    ? new Date(userStats.latestUpload).toLocaleDateString('tr-TR')
                    : '-'}
                </StatNumber>
              </Stat>
            </SimpleGrid>
          )}

          {/* Sosyal Medya Bağlantıları */}
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Text fontSize="lg" fontWeight="bold" mb={4} color={headingColor}>
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
            <Text fontSize="xl" fontWeight="bold" mb={4} color={headingColor}>
              Fotoğraflar
            </Text>
            {/* userId'yi doğru şekilde geçir */}
            <PhotoGrid 
              userId={profileUserId || currentUser?.uid} 
              onGridRefreshed={handleGridRefreshed}
            />
          </Box>
        </VStack>

        {/* Profil Düzenleme Modal */}
        {isOwnProfile && (
            <>
        <Modal isOpen={isProfileOpen} onClose={onProfileClose}>
          <ModalOverlay />
          <ModalContent bg={modalBg}>
            <ModalHeader color={headingColor}>Profili Düzenle</ModalHeader>
            <ModalCloseButton color={textColor} />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color={headingColor}>İsim</FormLabel>
                  <Input
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      displayName: e.target.value
                    }))}
                    bg={inputBg}
                    color={headingColor}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={headingColor}>Profil Fotoğrafı URL</FormLabel>
                  <Input
                    value={profileData.photoURL}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      photoURL: e.target.value
                    }))}
                    bg={inputBg}
                    color={headingColor}
                  />
                </FormControl>
                <FormControl isReadOnly>
                  <FormLabel color={headingColor}>Email</FormLabel>
                  <Input 
                    value={profileData.email} 
                    bg={disabledInputBg}
                    color={headingColor}
                  />
                </FormControl>
                
                {/* Sosyal Medya Bağlantıları */}
                <FormControl>
                  <FormLabel color={headingColor}>Facebook</FormLabel>
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
                      bg={inputBg}
                      color={headingColor}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel color={headingColor}>Twitter</FormLabel>
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
                      bg={inputBg}
                      color={headingColor}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel color={headingColor}>Instagram</FormLabel>
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
                      bg={inputBg}
                      color={headingColor}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel color={headingColor}>LinkedIn</FormLabel>
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
                      bg={inputBg}
                      color={headingColor}
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
          <ModalContent bg={modalBg}>
            <ModalHeader color={headingColor}>Şifre Değiştir</ModalHeader>
            <ModalCloseButton color={textColor} />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isInvalid={!!passwordErrors.currentPassword}>
                  <FormLabel color={headingColor}>Mevcut Şifre</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    bg={inputBg}
                    color={headingColor}
                  />
                  <FormErrorMessage>
                    {passwordErrors.currentPassword}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.newPassword}>
                  <FormLabel color={headingColor}>Yeni Şifre</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    bg={inputBg}
                    color={headingColor}
                  />
                  <FormErrorMessage>
                    {passwordErrors.newPassword}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                  <FormLabel color={headingColor}>Yeni Şifre (Tekrar)</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    bg={inputBg}
                    color={headingColor}
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
        </>
      )}
      </Container>
    </DashboardLayout>
  );
};
export default Profile;