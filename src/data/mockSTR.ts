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

export const mockSTRRecords: STRRecord[] = [
  { id: 'str-001', reference: 'STR-2026-00035', customerName: 'Chidinma Okafor', alertId: 'ALT-2026-0891', typology: 'POS Terminal Structuring', amount: 14500000, analyst: 'Adaeze Nkemdirim', status: 'Submitted to NFIU', filedDate: '2026-04-02' },
  { id: 'str-002', reference: 'STR-2026-00036', customerName: 'Emeka Nwosu', alertId: 'ALT-2026-0892', typology: 'BDC Liquidation', amount: 28000000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-04-02' },
  { id: 'str-003', reference: 'STR-2026-00037', customerName: 'Fatima Abdullahi', alertId: 'ALT-2026-0893', typology: 'Layered Transfers', amount: 6200000, analyst: 'Adaeze Nkemdirim', status: 'Pending Review', filedDate: '2026-04-04' },
  { id: 'str-004', reference: 'STR-2026-00038', customerName: 'Oluwaseun Adeyemi', alertId: 'ALT-2026-0894', typology: 'Rapid Movement of Funds', amount: 9800000, analyst: 'Chukwuma Ibe', status: 'Draft', filedDate: '2026-04-05' },
  { id: 'str-005', reference: 'STR-2026-00039', customerName: 'Amina Bello', alertId: 'ALT-2026-0895', typology: 'Unusual Cash Deposits', amount: 18500000, analyst: 'Ngozi Obi', status: 'Submitted to NFIU', filedDate: '2026-04-01' },
  { id: 'str-006', reference: 'STR-2026-00040', customerName: 'Ikechukwu Eze', alertId: 'ALT-2026-0896', typology: 'Shell Company Transfers', amount: 42000000, analyst: 'Adaeze Nkemdirim', status: 'Rejected', filedDate: '2026-04-03' },
  { id: 'str-007', reference: 'STR-2026-00041', customerName: 'Bola Tinubu Jr.', alertId: 'ALT-2026-0897', typology: 'POS Terminal Structuring', amount: 7800000, analyst: 'Ngozi Obi', status: 'Draft', filedDate: '2026-04-06' },
  { id: 'str-008', reference: 'STR-2026-00025', customerName: 'Kemi Adeosun', alertId: 'ALT-2026-0870', typology: 'BDC Liquidation', amount: 55000000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-03-28' },
  { id: 'str-009', reference: 'STR-2026-00026', customerName: 'Yusuf Datti', alertId: 'ALT-2026-0871', typology: 'Smurfing', amount: 3200000, analyst: 'Adaeze Nkemdirim', status: 'Submitted to NFIU', filedDate: '2026-03-28' },
  { id: 'str-010', reference: 'STR-2026-00027', customerName: 'Ngozi Iweala', alertId: 'ALT-2026-0872', typology: 'Unusual Cash Deposits', amount: 11000000, analyst: 'Ngozi Obi', status: 'Submitted to NFIU', filedDate: '2026-03-27' },
  { id: 'str-011', reference: 'STR-2026-00028', customerName: 'Abubakar Sadiq', alertId: 'ALT-2026-0873', typology: 'Layered Transfers', amount: 8700000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-03-26' },
  { id: 'str-012', reference: 'STR-2026-00029', customerName: 'Funke Akindele', alertId: 'ALT-2026-0874', typology: 'Rapid Movement of Funds', amount: 19500000, analyst: 'Adaeze Nkemdirim', status: 'Submitted to NFIU', filedDate: '2026-03-25' },
  { id: 'str-013', reference: 'STR-2026-00030', customerName: 'Hassan Danladi', alertId: 'ALT-2026-0875', typology: 'Shell Company Transfers', amount: 32000000, analyst: 'Ngozi Obi', status: 'Submitted to NFIU', filedDate: '2026-03-24' },
  { id: 'str-014', reference: 'STR-2026-00031', customerName: 'Tunde Bakare', alertId: 'ALT-2026-0876', typology: 'POS Terminal Structuring', amount: 5500000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-03-23' },
  { id: 'str-015', reference: 'STR-2026-00032', customerName: 'Zainab Mohammed', alertId: 'ALT-2026-0877', typology: 'Unusual Cash Deposits', amount: 14200000, analyst: 'Adaeze Nkemdirim', status: 'Submitted to NFIU', filedDate: '2026-03-22' },
  { id: 'str-016', reference: 'STR-2026-00033', customerName: 'Chidi Amaechi', alertId: 'ALT-2026-0878', typology: 'BDC Liquidation', amount: 27000000, analyst: 'Ngozi Obi', status: 'Submitted to NFIU', filedDate: '2026-03-21' },
  { id: 'str-017', reference: 'STR-2026-00034', customerName: 'Ladi Adebutu', alertId: 'ALT-2026-0879', typology: 'Smurfing', amount: 4800000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-03-20' },
  { id: 'str-018', reference: 'STR-2026-00022', customerName: 'Oby Ezekwesili', alertId: 'ALT-2026-0865', typology: 'Layered Transfers', amount: 21000000, analyst: 'Adaeze Nkemdirim', status: 'Submitted to NFIU', filedDate: '2026-03-18' },
  { id: 'str-019', reference: 'STR-2026-00023', customerName: 'Babajide Sanwo', alertId: 'ALT-2026-0866', typology: 'Rapid Movement of Funds', amount: 16500000, analyst: 'Ngozi Obi', status: 'Submitted to NFIU', filedDate: '2026-03-17' },
  { id: 'str-020', reference: 'STR-2026-00024', customerName: 'Maryam Uwais', alertId: 'ALT-2026-0867', typology: 'Shell Company Transfers', amount: 38000000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-03-16' },
  { id: 'str-021', reference: 'STR-2026-00019', customerName: 'Ibrahim Magu', alertId: 'ALT-2026-0860', typology: 'POS Terminal Structuring', amount: 12800000, analyst: 'Adaeze Nkemdirim', status: 'Submitted to NFIU', filedDate: '2026-03-14' },
  { id: 'str-022', reference: 'STR-2026-00020', customerName: 'Patience Jonathan', alertId: 'ALT-2026-0861', typology: 'Unusual Cash Deposits', amount: 95000000, analyst: 'Ngozi Obi', status: 'Submitted to NFIU', filedDate: '2026-03-13' },
  { id: 'str-023', reference: 'STR-2026-00021', customerName: 'Abdulrasheed Bawa', alertId: 'ALT-2026-0862', typology: 'BDC Liquidation', amount: 67000000, analyst: 'Chukwuma Ibe', status: 'Submitted to NFIU', filedDate: '2026-03-12' },
  { id: 'str-024', reference: 'STR-2026-00018', customerName: 'Dakore Akande', alertId: 'ALT-2026-0858', typology: 'Smurfing', amount: 2900000, analyst: 'Adaeze Nkemdirim', status: 'Pending Review', filedDate: '2026-04-07' },
  { id: 'str-025', reference: 'STR-2026-00017', customerName: 'Wale Edun', alertId: 'ALT-2026-0855', typology: 'Layered Transfers', amount: 15600000, analyst: 'Ngozi Obi', status: 'Draft', filedDate: '2026-04-08' },
];

export const mockNFIUSubmissions: NFIUSubmission[] = [
  { id: 'sub-001', timestamp: '2026-04-09T14:32:00Z', reference: 'STR-2026-00035', acknowledgmentStatus: 'Accepted' },
  { id: 'sub-002', timestamp: '2026-04-09T14:32:00Z', reference: 'STR-2026-00036', acknowledgmentStatus: 'Accepted' },
  { id: 'sub-003', timestamp: '2026-04-08T09:15:00Z', reference: 'STR-2026-00033', acknowledgmentStatus: 'Pending' },
  { id: 'sub-004', timestamp: '2026-04-07T16:45:00Z', reference: 'STR-2026-00034', acknowledgmentStatus: 'Accepted' },
  { id: 'sub-005', timestamp: '2026-04-06T11:20:00Z', reference: 'STR-2026-00006', acknowledgmentStatus: 'Rejected', rejectionReason: 'Incomplete narrative — missing triggering event details' },
];
