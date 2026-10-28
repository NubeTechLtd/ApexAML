export interface STRRecord {
  id: string;
  reference: string;
  customerName: string;
  alertId: string;
  typology: string;
  amount: number;
  analyst: string;
  status: 'Draft' | 'Pending Review' | 'Submitted to NFIU' | 'Rejected';
  filedDate: string;
}

export interface NFIUSubmission {
  id: string;
  timestamp: string;
  reference: string;
  acknowledgmentStatus: 'Accepted' | 'Pending' | 'Rejected';
  rejectionReason?: string;
}
