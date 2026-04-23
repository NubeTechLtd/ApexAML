export interface ConnectedEntity {
  id: string;
  label: string;
  type:
    | 'Shared Device ID'
    | 'Frequent Transfer Target'
    | 'Shared Address'
    | 'Common Beneficiary'
    | 'Common IP Address'
    | 'Bureau de Change (BDC)';
  detail: string;
}

export interface Customer360Data {
  id: number;
  name: string;
  bvn: string;
  nin: string;
  dob: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  riskScore: number;
  kycTier: string;
  bvnVerified: boolean;
  livenessCheck: 'Pass' | 'Fail' | 'Pending';
  accountStatus: 'Active' | 'Frozen' | 'Restricted';
  alerts: number;
  email: string;
  phone: string;
  address: string;
  radarScores: { axis: string; value: number }[];
  connectedEntities: ConnectedEntity[];
  eddDocuments: { name: string; type: string; uploadedAt: string }[];
}

export const customer360Data: Record<number, Customer360Data> = {
  1: {
    id: 1, name: 'Adebayo Ogunlesi', bvn: '22345678901', nin: '11234567890',
    dob: '15-Mar-1978', riskLevel: 'High', riskScore: 92, kycTier: 'Tier 3',
    bvnVerified: true, livenessCheck: 'Pass', accountStatus: 'Active', alerts: 5,
    email: 'adebayo.ogunlesi@email.com', phone: '+234 801 111 2233',
    address: '5 Bourdillon Road, Ikoyi, Lagos',
    radarScores: [
      { axis: 'PEP Exposure', value: 75 }, { axis: 'Cross-Border Vol.', value: 82 },
      { axis: 'Cash Intensity', value: 45 }, { axis: 'BVN/NIN Integrity', value: 18 },
      { axis: 'Peer Deviation', value: 91 }, { axis: 'Channel Conc.', value: 58 },
    ],
    connectedEntities: [
      { id: 'ce1', label: 'Device #A3F9', type: 'Shared Device ID', detail: 'Shared with 2 accounts (CUS-77104, CUS-88201)' },
      { id: 'ce2', label: 'Chioma Adekunle', type: 'Frequent Transfer Target', detail: '₦9.5M transferred in last 30 days' },
      { id: 'ce3', label: '192.168.44.x', type: 'Common IP Address', detail: 'Matches CUS-65520 (Fatima Abdullahi)' },
      { id: 'ce4', label: '14 Admiralty Way, Lekki', type: 'Shared Address', detail: 'Registered to 3 accounts' },
    ],
    eddDocuments: [
      { name: 'Source_of_Wealth_Declaration.pdf', type: 'EDD', uploadedAt: '2026-03-20' },
      { name: 'Tax_Returns_2025.pdf', type: 'Financial', uploadedAt: '2026-03-15' },
      { name: 'Utility_Bill_Lagos.pdf', type: 'Address Verification', uploadedAt: '2026-03-10' },
      { name: 'Corporate_Registry_Extract.pdf', type: 'Corporate', uploadedAt: '2026-02-28' },
    ],
  },
  2: {
    id: 2, name: 'Chioma Adekunle', bvn: '22345678902', nin: '11234567891',
    dob: '22-Aug-1990', riskLevel: 'Medium', riskScore: 54, kycTier: 'Tier 2',
    bvnVerified: true, livenessCheck: 'Pass', accountStatus: 'Active', alerts: 2,
    email: 'chioma.adekunle@email.com', phone: '+234 802 222 3344',
    address: '22 Allen Avenue, Ikeja, Lagos',
    radarScores: [
      { axis: 'PEP Exposure', value: 62 }, { axis: 'Cross-Border Vol.', value: 25 },
      { axis: 'Cash Intensity', value: 38 }, { axis: 'BVN/NIN Integrity', value: 10 },
      { axis: 'Peer Deviation', value: 42 }, { axis: 'Channel Conc.', value: 55 },
    ],
    connectedEntities: [
      { id: 'ce5', label: 'Adekunle Ventures', type: 'Frequent Transfer Target', detail: 'Regular monthly transfers' },
    ],
    eddDocuments: [],
  },
  3: {
    id: 3, name: 'Emeka Obi', bvn: '22345678903', nin: '11234567892',
    dob: '05-Jan-1995', riskLevel: 'Low', riskScore: 12, kycTier: 'Tier 3',
    bvnVerified: true, livenessCheck: 'Pass', accountStatus: 'Active', alerts: 0,
    email: 'emeka.obi@email.com', phone: '+234 803 333 4455',
    address: '9 Market Road, Onitsha',
    radarScores: [
      { axis: 'PEP Exposure', value: 5 }, { axis: 'Cross-Border Vol.', value: 12 },
      { axis: 'Cash Intensity', value: 20 }, { axis: 'BVN/NIN Integrity', value: 8 },
      { axis: 'Peer Deviation', value: 10 }, { axis: 'Channel Conc.', value: 15 },
    ],
    connectedEntities: [],
    eddDocuments: [],
  },
  4: {
    id: 4, name: 'Fatima Bello', bvn: '22345678904', nin: '11234567893',
    dob: '19-Nov-1982', riskLevel: 'High', riskScore: 88, kycTier: 'Tier 1',
    bvnVerified: true, livenessCheck: 'Pending', accountStatus: 'Restricted', alerts: 8,
    email: 'fatima.bello@email.com', phone: '+234 804 444 5566',
    address: '3 Sultan Road, Kaduna',
    radarScores: [
      { axis: 'PEP Exposure', value: 88 }, { axis: 'Cross-Border Vol.', value: 78 },
      { axis: 'Cash Intensity', value: 72 }, { axis: 'BVN/NIN Integrity', value: 65 },
      { axis: 'Peer Deviation', value: 85 }, { axis: 'Channel Conc.', value: 40 },
    ],
    connectedEntities: [
      { id: 'ce6', label: 'Device #B7K2', type: 'Shared Device ID', detail: 'Also used by CUS-31998 (Ibrahim Musa)' },
      { id: 'ce7', label: 'Mohammed Al-Rashid', type: 'Frequent Transfer Target', detail: 'OFAC partial match' },
      { id: 'ce8', label: '3 Sultan Road, Kaduna', type: 'Shared Address', detail: 'Matches CUS-54301 (Emeka Nwosu)' },
      { id: 'ce9', label: 'Bello Family Trust', type: 'Frequent Transfer Target', detail: '₦18M across 6 transactions' },
    ],
    eddDocuments: [
      { name: 'PEP_Screening_Report.pdf', type: 'EDD', uploadedAt: '2026-04-01' },
    ],
  },
  5: {
    id: 5, name: 'Ibrahim Musa', bvn: '22345678905', nin: '11234567894',
    dob: '12-May-1985', riskLevel: 'Low', riskScore: 28, kycTier: 'Tier 3',
    bvnVerified: true, livenessCheck: 'Pass', accountStatus: 'Active', alerts: 1,
    email: 'ibrahim.musa@email.com', phone: '+234 805 555 6677',
    address: '15 Independence Avenue, Abuja',
    radarScores: [
      { axis: 'PEP Exposure', value: 35 }, { axis: 'Cross-Border Vol.', value: 28 },
      { axis: 'Cash Intensity', value: 15 }, { axis: 'BVN/NIN Integrity', value: 12 },
      { axis: 'Peer Deviation', value: 22 }, { axis: 'Channel Conc.', value: 30 },
    ],
    connectedEntities: [
      { id: 'ce10', label: 'Device #B7K2', type: 'Shared Device ID', detail: 'Also used by CUS-88291 (Fatima Bello)' },
    ],
    eddDocuments: [],
  },
  6: {
    id: 6, name: 'Ngozi Okafor', bvn: '22345678906', nin: '11234567895',
    dob: '30-Jun-1988', riskLevel: 'Medium', riskScore: 61, kycTier: 'Tier 2',
    bvnVerified: true, livenessCheck: 'Pass', accountStatus: 'Active', alerts: 3,
    email: 'ngozi.okafor@email.com', phone: '+234 806 666 7788',
    address: '7 Awolowo Road, Ikoyi, Lagos',
    radarScores: [
      { axis: 'PEP Exposure', value: 20 }, { axis: 'Cross-Border Vol.', value: 45 },
      { axis: 'Cash Intensity', value: 55 }, { axis: 'BVN/NIN Integrity', value: 15 },
      { axis: 'Peer Deviation', value: 60 }, { axis: 'Channel Conc.', value: 72 },
    ],
    connectedEntities: [
      { id: 'ce11', label: 'Okafor Enterprises', type: 'Frequent Transfer Target', detail: '₦12M single wire transfer' },
    ],
    eddDocuments: [
      { name: 'Bank_Statement_Q1_2026.pdf', type: 'Financial', uploadedAt: '2026-04-05' },
    ],
  },
};
