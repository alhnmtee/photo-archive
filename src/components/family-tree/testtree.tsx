import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
} from '@chakra-ui/react';
import { familyTreeService } from '../../services/familyTreeService';
export const InitialMemberForm = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    birthPlace: '',
    gender: 'male' as 'male' | 'female',
  });

  const handleSubmit = async () => {
    if (!formData.fullName) {
      toast({
        title: 'Hata',
        description: 'Lütfen ad soyad giriniz',
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
          createdBy: 'system',
        }
      });

      toast({
        title: 'Başarılı',
        description: 'İlk aile üyesi eklendi',
        status: 'success',
      });

      // Formu sıfırla
      setFormData({
        fullName: '',
        birthDate: '',
        birthPlace: '',
        gender: 'male',
      });

    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Üye eklenirken bir hata oluştu',
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