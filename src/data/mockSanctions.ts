export interface SanctionsMatch {
  id: string;
  matchScore: number;
  status: 'Pending' | 'Dismissed' | 'Confirmed';
  matchingFields: string[];
  internal: {
    name: string;
    dob: string;
    nationality: string;
    location: string;
    bvn: string;
    idType: string;
    accountNumber: string;
    kycTier: string;
  };
  sanctions: {
    name: string;
    dob: string;
    nationality: string;
    location: string;
    list: string;
    listId: string;
    reason: string;
    dateAdded: string;
    aliases: string[];
  };
}

export const mockSanctionsMatches: SanctionsMatch[] = [
  {
    id: 'SCR-001',
    matchScore: 88,
    status: 'Pending',
    matchingFields: ['name', 'nationality'],
    internal: {
      name: 'Ibrahim Musa',
      dob: '12-May-1985',
      nationality: 'Nigerian',
      location: 'Kano, Nigeria',
      bvn: '22345678905',
      idType: 'NIN',
      accountNumber: '00890xxxx12',
      kycTier: 'Tier 3',
    },
    sanctions: {
      name: 'Ibrahim Al-Musa',
      dob: '1984',
      nationality: 'Chad / Nigeria',
      location: 'Borno State',
      list: 'UN Security Council / EFCC',
      listId: 'UNSC-2024-4481',
      reason: 'Terrorism Financing',
      dateAdded: '2024-11-03',
      aliases: ['Abu Ibrahim', 'I. Al-Musa', 'Ibrahim Mousa'],
    },
  },
  {
    id: 'SCR-002',
    matchScore: 72,
    status: 'Pending',
    matchingFields: ['name'],
    internal: {
      name: 'Chinedu Eze',
      dob: '21-Aug-1990',
      nationality: 'Nigerian',
      location: 'Lagos, Nigeria',
      bvn: '22187xxxxxx',
      idType: 'NIN',
      accountNumber: '00456xxxx23',
      kycTier: 'Tier 3',
    },
    sanctions: {
      name: 'Chinedu C. Eze',
      dob: '1991',
      nationality: 'Nigerian',
      location: 'Unknown',
      list: 'OFAC SDN List',
      listId: 'OFAC-2025-1192',
      reason: 'Money Laundering — West African network',
      dateAdded: '2025-01-18',
      aliases: ['C. Eze', 'Chinedu Emmanuel Eze'],
    },
  },
  {
    id: 'SCR-003',
    matchScore: 45,
    status: 'Pending',
    matchingFields: [],
    internal: {
      name: 'Fatima Abdullahi',
      dob: '05-Dec-1993',
      nationality: 'Nigerian',
      location: 'Kaduna, Nigeria',
      bvn: '22145xxxxxx',
      idType: 'Voter ID',
      accountNumber: '00789xxxx56',
      kycTier: 'Tier 3',
    },
    sanctions: {
      name: 'Fatimah Abdullah',
      dob: '1978',
      nationality: 'Yemeni',
      location: 'Sana\'a, Yemen',
      list: 'EU Consolidated List',
      listId: 'EU-2023-7890',
      reason: 'Proliferation Financing',
      dateAdded: '2023-06-22',
      aliases: ['Fatima A.', 'F. Abdullah'],
    },
  },
];
