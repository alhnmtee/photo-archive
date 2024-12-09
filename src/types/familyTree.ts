// src/types/familyTree.ts

export interface FamilyMember {
    id: string;
    fullName: string;
    birthDate?: string;
    deathDate?: string;
    birthPlace?: string;
    photoURL?: string;
    gender: 'male' | 'female';
    parents?: {
      fatherId?: string;
      motherId?: string;
    };
    spouses?: Array<{
      id: string;
      marriageDate?: string;
      divorceDate?: string;
      isCurrentSpouse: boolean;
    }>;
    children?: string[]; // child IDs
    siblings?: string[]; // sibling IDs
    metadata?: {
      createdAt: string;
      updatedAt: string;
      createdBy: string;
    };
  }
  
  export interface FamilyTreeNode extends FamilyMember {
    level: number;
    x: number;
    y: number;
    layout?: {
      width: number;
      height: number;
      isCollapsed?: boolean;
    };
  }
  
  export interface FamilyConnection {
    id: string;
    type: 'parent-child' | 'spouse';
    from: string;
    to: string;
    metadata?: {
      relationshipType?: string;
      startDate?: string;
      endDate?: string;
    };
  }