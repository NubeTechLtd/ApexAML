export interface ConnectedEntity {
  id: string;
  label: string;
  type: 'Shared Device ID' | 'Frequent Transfer Target' | 'Shared Address' | 'Common Beneficiary';
  detail: string;
}

export interface Customer360Data {
  id: number;
  name: string;
  bvn: string;
  nin: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  kycTier: string;
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
    riskLevel: 'High', kycTier: 'Tier 3', alerts: 5,
    email: 'adebayo.ogunlesi@email.com', phone: '+234 801 111 2233',
    address: '5 Bourdillon Road, Ikoyi, Lagos',
    radarScores: [
      { axis: 'Velocity', value: 82 }, { axis: 'Volume', value: 90 },
      { axis: 'Jurisdiction', value: 45 }, { axis: 'Structuring', value: 95 },
      { axis: 'PEP Proximity', value: 60 },
    ],
    connectedEntities: [
      { id: 'ce1', label: 'Device #A3F9', type: 'Shared Device ID', detail: 'Also used by CUS-77104 (Chinedu Eze)' },
      { id: 'ce2', label: 'Olu Holdings Ltd', type: 'Frequent Transfer Target', detail: '₦9.5M transferred in last 30 days' },
      { id: 'ce3', label: '14 Admiralty Way, Lekki', type: 'Shared Address', detail: 'Matches CUS-65520 (Fatima Abdullahi)' },
    ],
    eddDocuments: [
      { name: 'Source_of_Wealth_Declaration.pdf', type: 'EDD', uploadedAt: '2026-03-20' },
      { name: 'Tax_Returns_2025.pdf', type: 'Financial', uploadedAt: '2026-03-15' },
    ],
  },
  2: {
    id: 2, name: 'Chioma Adekunle', bvn: '22345678902', nin: '11234567891',
    riskLevel: 'Medium', kycTier: 'Tier 2', alerts: 2,
    email: 'chioma.adekunle@email.com', phone: '+234 802 222 3344',
    address: '22 Allen Avenue, Ikeja, Lagos',
    radarScores: [
      { axis: 'Velocity', value: 40 }, { axis: 'Volume', value: 55 },
      { axis: 'Jurisdiction', value: 20 }, { axis: 'Structuring', value: 30 },
      { axis: 'PEP Proximity', value: 65 },
    ],
    connectedEntities: [
      { id: 'ce4', label: 'Adekunle Ventures', type: 'Common Beneficiary', detail: 'Regular monthly transfers' },
    ],
    eddDocuments: [],
  },
  3: {
    id: 3, name: 'Emeka Obi', bvn: '22345678903', nin: '11234567892',
    riskLevel: 'Low', kycTier: 'Tier 3', alerts: 0,
    email: 'emeka.obi@email.com', phone: '+234 803 333 4455',
    address: '9 Market Road, Onitsha',
    radarScores: [
      { axis: 'Velocity', value: 15 }, { axis: 'Volume', value: 20 },
      { axis: 'Jurisdiction', value: 10 }, { axis: 'Structuring', value: 5 },
      { axis: 'PEP Proximity', value: 8 },
    ],
    connectedEntities: [],
    eddDocuments: [],
  },
  4: {
    id: 4, name: 'Fatima Bello', bvn: '22345678904', nin: '11234567893',
    riskLevel: 'High', kycTier: 'Tier 1', alerts: 8,
    email: 'fatima.bello@email.com', phone: '+234 804 444 5566',
    address: '3 Sultan Road, Kaduna',
    radarScores: [
      { axis: 'Velocity', value: 88 }, { axis: 'Volume', value: 75 },
      { axis: 'Jurisdiction', value: 92 }, { axis: 'Structuring', value: 70 },
      { axis: 'PEP Proximity', value: 85 },
    ],
    connectedEntities: [
      { id: 'ce5', label: 'Device #B7K2', type: 'Shared Device ID', detail: 'Also used by CUS-31998 (Ibrahim Musa)' },
      { id: 'ce6', label: 'Mohammed Al-Rashid', type: 'Frequent Transfer Target', detail: 'OFAC partial match' },
      { id: 'ce7', label: '3 Sultan Road, Kaduna', type: 'Shared Address', detail: 'Matches CUS-54301 (Emeka Nwosu)' },
      { id: 'ce8', label: 'Bello Family Trust', type: 'Common Beneficiary', detail: '₦18M across 6 transactions' },
    ],
    eddDocuments: [
      { name: 'PEP_Screening_Report.pdf', type: 'EDD', uploadedAt: '2026-04-01' },
    ],
  },
  5: {
    id: 5, name: 'Ibrahim Musa', bvn: '22345678905', nin: '11234567894',
    riskLevel: 'Low', kycTier: 'Tier 3', alerts: 1,
    email: 'ibrahim.musa@email.com', phone: '+234 805 555 6677',
    address: '15 Independence Avenue, Abuja',
    radarScores: [
      { axis: 'Velocity', value: 25 }, { axis: 'Volume', value: 18 },
      { axis: 'Jurisdiction', value: 30 }, { axis: 'Structuring', value: 12 },
      { axis: 'PEP Proximity', value: 40 },
    ],
    connectedEntities: [
      { id: 'ce9', label: 'Device #B7K2', type: 'Shared Device ID', detail: 'Also used by CUS-88291 (Fatima Bello)' },
    ],
    eddDocuments: [],
  },
  6: {
    id: 6, name: 'Ngozi Okafor', bvn: '22345678906', nin: '11234567895',
    riskLevel: 'Medium', kycTier: 'Tier 2', alerts: 3,
    email: 'ngozi.okafor@email.com', phone: '+234 806 666 7788',
    address: '7 Awolowo Road, Ikoyi, Lagos',
    radarScores: [
      { axis: 'Velocity', value: 50 }, { axis: 'Volume', value: 60 },
      { axis: 'Jurisdiction', value: 35 }, { axis: 'Structuring', value: 55 },
      { axis: 'PEP Proximity', value: 25 },
    ],
    connectedEntities: [
      { id: 'ce10', label: 'Okafor Enterprises', type: 'Frequent Transfer Target', detail: '₦12M single wire transfer' },
    ],
    eddDocuments: [
      { name: 'Bank_Statement_Q1_2026.pdf', type: 'Financial', uploadedAt: '2026-04-05' },
    ],
  },
};
