// src/services/familyTreeService.ts

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FamilyMember, FamilyConnection } from '../types/familyTree';

export const familyTreeService = {
  async createFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
    const membersRef = collection(db, 'familyMembers');
    const newMemberRef = doc(membersRef);
    const newMember = {
      id: newMemberRef.id,
      ...member,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: member.metadata?.createdBy || 'system'
      }
    };

    await setDoc(newMemberRef, newMember);
    return newMember;
  },

  async getFamilyMember(memberId: string): Promise<FamilyMember | null> {
    const memberRef = doc(db, 'familyMembers', memberId);
    const memberDoc = await getDoc(memberRef);
    
    if (!memberDoc.exists()) {
      return null;
    }

    return { id: memberDoc.id, ...memberDoc.data() } as FamilyMember;
  },

  async getFamilyTree(rootMemberId: string, generations: number = 3): Promise<{
    members: FamilyMember[];
    connections: FamilyConnection[];
  }> {
    const members = new Set<FamilyMember>();
    const connections = new Set<FamilyConnection>();
    
    const processMembers = async (memberId: string, currentGen: number) => {
      if (currentGen > generations) return;
      
      const member = await this.getFamilyMember(memberId);
      if (!member) return;
      
      members.add(member);

      // Process parents
      if (member.parents) {
        if (member.parents.fatherId) {
          connections.add({
            id: `${member.parents.fatherId}-${member.id}`,
            type: 'parent-child',
            from: member.parents.fatherId,
            to: member.id
          });
          await processMembers(member.parents.fatherId, currentGen + 1);
        }
        if (member.parents.motherId) {
          connections.add({
            id: `${member.parents.motherId}-${member.id}`,
            type: 'parent-child',
            from: member.parents.motherId,
            to: member.id
          });
          await processMembers(member.parents.motherId, currentGen + 1);
        }
      }

      // Process spouses
      if (member.spouses) {
        for (const spouse of member.spouses) {
          connections.add({
            id: `${member.id}-${spouse.id}`,
            type: 'spouse',
            from: member.id,
            to: spouse.id,
            metadata: {
              relationshipType: spouse.isCurrentSpouse ? 'current' : 'previous',
              startDate: spouse.marriageDate,
              endDate: spouse.divorceDate
            }
          });
        }
      }

      // Process children
      if (member.children) {
        for (const childId of member.children) {
          connections.add({
            id: `${member.id}-${childId}`,
            type: 'parent-child',
            from: member.id,
            to: childId
          });
          await processMembers(childId, currentGen + 1);
        }
      }
    };

    await processMembers(rootMemberId, 0);
    
    return {
      members: Array.from(members),
      connections: Array.from(connections)
    };
  },

  async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<void> {
    const memberRef = doc(db, 'familyMembers', memberId);
    await updateDoc(memberRef, {
      ...updates,
      'metadata.updatedAt': new Date().toISOString()
    });
  }
};