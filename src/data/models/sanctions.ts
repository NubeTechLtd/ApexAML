export interface SanctionsMatch {
  id: string;
  matchScore: number;
  status: 'Pending' | 'Dismissed' | 'Confirmed';
  matchingFields: string[];
  slaDeadline: string;
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
