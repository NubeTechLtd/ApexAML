export interface SanctionsMatch {
  id: string;
  matchScore: number;
  status: 'Pending' | 'Dismissed' | 'Confirmed';
  internal: {
    name: string;
    dob: string;
    nationality: string;
    location: string;
    bvn: string;
    accountNumber: string;
    kycTier: string;
  };
  sanctions: {
    name: string;
    dob: string;
    nationality: string;
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
    internal: {
      name: 'Ibrahim Musa',
      dob: '1985-03-14',
      nationality: 'Nigerian',
      location: 'Kano, Nigeria',
      bvn: '22178xxxxxx',
      accountNumber: '00890xxxx12',
      kycTier: 'Tier 3',
    },
    sanctions: {
      name: 'Ibrahim Al-Musa',
      dob: '1984-06-22',
      nationality: 'Nigerian / Sudanese',
      list: 'UN Security Council',
      listId: 'UNSC-2024-4481',
      reason: 'Terrorism Financing — Al-Shabaab network',
      dateAdded: '2024-11-03',
      aliases: ['Abu Ibrahim', 'I. Al-Musa', 'Ibrahim Mousa'],
    },
  },
  {
    id: 'SCR-002',
    matchScore: 72,
    status: 'Pending',
    internal: {
      name: 'Chinedu Eze',
      dob: '1990-08-21',
      nationality: 'Nigerian',
      location: 'Lagos, Nigeria',
      bvn: '22187xxxxxx',
      accountNumber: '00456xxxx23',
      kycTier: 'Tier 3',
    },
    sanctions: {
      name: 'Chinedu C. Eze',
      dob: '1991-01-15',
      nationality: 'Nigerian',
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
    internal: {
      name: 'Fatima Abdullahi',
      dob: '1993-12-05',
      nationality: 'Nigerian',
      location: 'Kaduna, Nigeria',
      bvn: '22145xxxxxx',
      accountNumber: '00789xxxx56',
      kycTier: 'Tier 3',
    },
    sanctions: {
      name: 'Fatimah Abdullah',
      dob: '1978-04-10',
      nationality: 'Yemeni',
      list: 'EU Consolidated List',
      listId: 'EU-2023-7890',
      reason: 'Proliferation Financing',
      dateAdded: '2023-06-22',
      aliases: ['Fatima A.', 'F. Abdullah'],
    },
  },
];
