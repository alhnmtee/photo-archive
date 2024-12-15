import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { FamilyMember, FamilyConnection } from '../types/familyTree';

export const familyTreeService = {
  async createFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    try {
      // Önce authentication durumunu kontrol et
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Kullanıcı giriş yapmamış');
      }

      const membersRef = collection(db, 'familyMembers');
      const newMemberRef = doc(membersRef);
      const newMember = {
        id: newMemberRef.id,
        ...member,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: currentUser.uid
        }
      };

      await setDoc(newMemberRef, newMember);
      return newMember;
    } catch (error) {
      console.error('Error creating family member:', error);
      throw error;
    }
  },

  async getFamilyMember(memberId: string): Promise<FamilyMember | null> {
    try {
      const memberRef = doc(db, 'familyMembers', memberId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        return null;
      }

      return { id: memberDoc.id, ...memberDoc.data() } as FamilyMember;
    } catch (error) {
      console.error('Error getting family member:', error);
      throw error;
    }
  },

  async getFamilyTree(rootMemberId: string, generations: number = 3): Promise<{
    members: FamilyMember[];
    connections: FamilyConnection[];
  }> {
    try {
      console.log('Starting getFamilyTree with rootMemberId:', rootMemberId);
      
      // Tüm üyeleri direkt çekelim
      const membersRef = collection(db, 'familyMembers');
      const querySnapshot = await getDocs(membersRef);
      
      const members = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FamilyMember));
  
      console.log('Found members:', members);
  
      // Şimdilik basit bağlantılar oluşturalım
      const connections: FamilyConnection[] = [];
      members.forEach(member => {
        if (member.parents) {
          if (member.parents.fatherId) {
            connections.push({
              id: `${member.parents.fatherId}-${member.id}`,
              type: 'parent-child',
              from: member.parents.fatherId,
              to: member.id
            });
          }
          if (member.parents.motherId) {
            connections.push({
              id: `${member.parents.motherId}-${member.id}`,
              type: 'parent-child',
              from: member.parents.motherId,
              to: member.id
            });
          }
        }
      });
  
      console.log('Returning data:', { members, connections });
      
      return {
        members,
        connections
      };
    } catch (error) {
      console.error('Error in getFamilyTree:', error);
      throw error;
    }
  },
  async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Kullanıcı giriş yapmamış');
      }

      const memberRef = doc(db, 'familyMembers', memberId);
      await updateDoc(memberRef, {
        ...updates,
        'metadata.updatedAt': new Date().toISOString(),
        'metadata.updatedBy': currentUser.uid
      });
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }
};