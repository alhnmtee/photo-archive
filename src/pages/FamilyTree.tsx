import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  useDisclosure,
  VStack,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useColorModeValue,
  Spinner,
  Text
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import FamilyTree from '../components/family-tree';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyTreeService } from '../services/familyTreeService';
import { FamilyMember } from '../types/familyTree';
import { useAuth } from '../contexts/AuthContext';

// InitialMemberForm komponenti
const InitialMemberForm = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();  // useAuth ekleyin
  const queryClient = useQueryClient();  // QueryClient ekleyin

  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    birthPlace: '',
    gender: 'male' as 'male' | 'female',
  });

  const handleSubmit = async () => {
    if (!formData.fullName || !currentUser) {  // currentUser kontrolü ekleyin
      toast({
        title: 'Hata',
        description: 'Lütfen ad soyad giriniz ve giriş yaptığınızdan emin olun',
        status: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await familyTreeService.createFamilyMember({
        ...formData,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: currentUser.uid  // currentUser.uid kullanın
        }
      });

      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['familyTree'] });

      toast({
        title: 'Başarılı',
        description: 'İlk aile üyesi eklendi',
        status: 'success',
      });

      setFormData({
        fullName: '',
        birthDate: '',
        birthPlace: '',
        gender: 'male',
      });

    } catch (error) {
      console.error('Error creating member:', error);
      toast({
        title: 'Hata',
        description: 'Üye eklenirken bir hata oluştu. Lütfen giriş yaptığınızdan emin olun.',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg">
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Ad Soyad</FormLabel>
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              fullName: e.target.value
            }))}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Doğum Tarihi</FormLabel>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              birthDate: e.target.value
            }))}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Doğum Yeri</FormLabel>
          <Input
            value={formData.birthPlace}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              birthPlace: e.target.value
            }))}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Cinsiyet</FormLabel>
          <Select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              gender: e.target.value as 'male' | 'female'
            }))}
          >
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
          </Select>
        </FormControl>

        <Button 
          colorScheme="blue" 
          onClick={handleSubmit}
          isLoading={loading}
          width="full"
        >
          İlk Üyeyi Ekle
        </Button>
      </VStack>
    </Box>
  );
};

// Ana FamilyTreePage komponenti
export const FamilyTreePage = () => {
  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  // Renk değişkenleri
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Form state'i
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    birthPlace: '',
    gender: 'male' as 'male' | 'female',
    fatherId: '',
    motherId: '',
  });

  // Veri sorgulama
  const { data: familyData, isLoading } = useQuery({
    queryKey: ['familyTree', currentUser?.uid],
    queryFn: () => familyTreeService.getFamilyTree(currentUser?.uid || '', 4),
    enabled: !!currentUser
  });

  // Üye ekleme mutasyonu
  const createMemberMutation = useMutation({
    mutationFn: (newMember: Omit<FamilyMember, 'id'>) => 
      familyTreeService.createFamilyMember(newMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyTree'] });
      toast({
        title: 'Başarılı',
        description: 'Aile üyesi eklendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  });

  const handleMemberClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormData({
      fullName: member.fullName,
      birthDate: member.birthDate || '',
      birthPlace: member.birthPlace || '',
      gender: member.gender,
      fatherId: member.parents?.fatherId || '',
      motherId: member.parents?.motherId || '',
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    const memberData: Omit<FamilyMember, 'id'> = {
      fullName: formData.fullName,
      birthDate: formData.birthDate,
      birthPlace: formData.birthPlace,
      gender: formData.gender,
      parents: {
        fatherId: formData.fatherId || undefined,
        motherId: formData.motherId || undefined,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid,
      }
    };

    try {
      if (selectedMember) {
        await familyTreeService.updateFamilyMember(selectedMember.id, memberData);
        toast({
          title: 'Başarılı',
          description: 'Aile üyesi güncellendi',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createMemberMutation.mutateAsync(memberData);
      }
      onClose();
      setSelectedMember(null);
      setFormData({
        fullName: '',
        birthDate: '',
        birthPlace: '',
        gender: 'male',
        fatherId: '',
        motherId: '',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'İşlem sırasında bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Container maxW="container.xl" py={8}>
          <Spinner size="xl" />
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between">
            <Heading size="lg">Soy Ağacı</Heading>
            {familyData && familyData.members.length > 0 && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={() => {
                  setSelectedMember(null);
                  onOpen();
                }}
              >
                Yeni Üye Ekle
              </Button>
            )}
          </HStack>

          {!familyData?.members || familyData.members.length === 0 ? (
              <Box maxW="md" mx="auto">
                <Text textAlign="center" mb={4}>
                  Henüz soy ağacında hiç üye yok. İlk üyeyi ekleyerek başlayın.
                </Text>
                <InitialMemberForm />
              </Box>
            ) : (
              <Box
              bg={bgColor}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              height="calc(100vh - 250px)"
              width="100%"
              position="relative"
              overflow="hidden"
            >
              <FamilyTree
                members={familyData.members}
                connections={familyData.connections}
                onMemberClick={handleMemberClick}
                rootMemberId={currentUser?.uid || familyData.members[0]?.id}
              />
            </Box>
            )}

          {/* Üye Ekleme/Düzenleme Modal */}
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg={bgColor}>
              <ModalHeader>
                {selectedMember ? 'Üye Düzenle' : 'Yeni Üye Ekle'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Ad Soyad</FormLabel>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fullName: e.target.value
                      }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Doğum Tarihi</FormLabel>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        birthDate: e.target.value
                      }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Doğum Yeri</FormLabel>
                    <Input
                      value={formData.birthPlace}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        birthPlace: e.target.value
                      }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cinsiyet</FormLabel>
                    <Select
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        gender: e.target.value as 'male' | 'female'
                      }))}
                    >
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Baba</FormLabel>
                    <Select
                      value={formData.fatherId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fatherId: e.target.value
                      }))}
                    >
                      <option value="">Seçiniz...</option>
                      {familyData?.members
                        .filter(m => m.gender === 'male')
                        .map(member => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Anne</FormLabel>
                    <Select
                      value={formData.motherId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        motherId: e.target.value
                      }))}
                    >
                      <option value="">Seçiniz...</option>
                      {familyData?.members
                        .filter(m => m.gender === 'female')
                        .map(member => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                    </Select>
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    width="full"
                    onClick={handleSubmit}
                    isLoading={createMemberMutation.isPending}
                  >
                    {selectedMember ? 'Güncelle' : 'Ekle'}
                  </Button>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
    </DashboardLayout>
  );
};