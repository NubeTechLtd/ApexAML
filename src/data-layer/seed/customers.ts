/**
 * The 40 fictional customers of the sample bank. Surnames are deliberately
 * invented ("Testimehin", "Mockpelumi"…) and every BVN/NIN starts with 000,
 * which no real Nigerian identifier does.
 */
import type { EntityType, ForeignBusinessKYB } from '@/data/models/customer360';
import { pad } from './random';

export type Tier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface SeedCustomer {
  num: number;
  ref: string;
  fullName: string;
  entityType: EntityType;
  occupation: string;
  kycTier: Tier;
  bvn: string;
  nin: string;
  nuban: string;
  dob: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  riskScore: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  accountStatus: 'Active' | 'Frozen' | 'Restricted';
  bvnVerified: boolean;
  liveness: 'Pass' | 'Fail' | 'Pending';
  cacNumber?: string;
  foreignKYB?: ForeignBusinessKYB;
  /** IMTO operator name for settlement-account holders. */
  imtoOperator?: string;
}

type Spec = [name: string, type: EntityType, occupation: string, tier: Tier, address: string, city: string, score: number, status?: SeedCustomer['accountStatus']];

const SPECS: Spec[] = [
  ['Adebayo Testimehin', 'Individual', 'Phone Accessories Trader', 'Tier 3', '14 Sample Street, Lagos Island', 'Lagos', 94, 'Restricted'],
  ['Emeka Mockpelumi', 'Individual', 'Student', 'Tier 1', '42 Placeholder Close, Surulere', 'Lagos', 88],
  ['Fatima Sampleyi', 'Individual', 'Retail Merchant', 'Tier 3', '15 Demo Crescent, Wuse II', 'Abuja', 75],
  ['Abubakar Demoyinka', 'Individual', 'Civil Servant', 'Tier 2', '8 Fiction Road', 'Sokoto', 72],
  ['Chioma Fictionwu', 'Individual', 'Import/Export Trader', 'Tier 3', '22 Mock Marine Road, Apapa', 'Lagos', 58],
  ['Kelechi Dummolade', 'Individual', 'Unverified (IMTO walk-in)', 'Tier 1', '27 Sample Avenue, Ikeja', 'Lagos', 91],
  ['Oluwaseun Seedaku', 'Individual', 'Freelance Consultant', 'Tier 2', '8 Lorem Way, Lekki Phase 1', 'Lagos', 94],
  ['Tunde Placeholdu', 'Individual', 'Unverified (IMTO walk-in)', 'Tier 1', '12 Ipsum Road, Ikoyi', 'Lagos', 95],
  ['Ngozi Loremade', 'Individual', 'Fashion Designer', 'Tier 2', '3 Demo Layout, Independence Layout', 'Enugu', 66],
  ['Ibrahim Ipsumbi', 'Individual', 'Livestock Trader', 'Tier 3', '19 Fiction Market Road, Fagge', 'Kano', 81, 'Frozen'],
  ['Halima Testimehin', 'Individual', 'Former Local Government Chair (PEP)', 'Tier 3', '6 Sample GRA', 'Kaduna', 78],
  ['Chinedu Mockpelumi', 'Individual', 'Ride-hailing Driver', 'Tier 2', '11 Placeholder Street, D-Line', 'Port Harcourt', 69],
  ['Aisha Sampleyi', 'Individual', 'Textile Importer', 'Tier 3', '30 Demo Bompai Road', 'Kano', 90, 'Frozen'],
  ['Olumide Demoyinka', 'Individual', 'Retired Teacher', 'Tier 2', '4 Fiction Close, Bodija', 'Ibadan', 40],
  ['Blessing Fictionwu', 'Sole Trader', 'POS Agent Operator', 'Tier 2', '9 Mock Junction, Ojota', 'Lagos', 74],
  ['Yemi Dummolade', 'Individual', 'Payroll Officer', 'Tier 2', '17 Sample Road, Oke-Ilewo', 'Abeokuta', 63],
  ['Obinna Seedaku', 'Individual', 'Software Developer', 'Tier 3', '25 Lorem Street, Yaba', 'Lagos', 85],
  ['Zainab Placeholdu', 'Individual', 'Car Dealer', 'Tier 3', '2 Ipsum Avenue, Garki', 'Abuja', 71],
  ['Kunle Loremade', 'Individual', 'Student', 'Tier 1', '7 Demo Hostel Road', 'Ile-Ife', 45],
  ['Amina Ipsumbi', 'Individual', 'Market Trader', 'Tier 1', '13 Fiction Terminus Road', 'Jos', 67],
  ['Ifeanyi Testimehin', 'Individual', 'Real Estate Agent', 'Tier 3', '40 Sample Admiralty Way, Lekki', 'Lagos', 79],
  ['Bukola Mockpelumi', 'Sole Trader', 'Supermarket Owner', 'Tier 3', '5 Placeholder Allen Avenue, Ikeja', 'Lagos', 52],
  ['Sade Sampleyi', 'Sole Trader', 'Fuel Station Manager', 'Tier 3', '21 Demo Sapele Road', 'Benin City', 55],
  ['Musa Demoyinka', 'Sole Trader', 'Grain Merchant', 'Tier 3', '33 Fiction Dawanau Market', 'Kano', 50],
  ['Nkechi Fictionwu', 'Sole Trader', 'Pharmacy Owner', 'Tier 3', '18 Mock New Market Road', 'Onitsha', 48],
  ['Garba Dummolade', 'Individual', 'Haulage Transporter', 'Tier 2', '10 Sample Baga Road', 'Maiduguri', 62],
  ['Efe Seedaku', 'Individual', 'Oil Services Technician', 'Tier 2', '6 Lorem Effurun Road', 'Warri', 35],
  ['Hauwa Placeholdu', 'Individual', 'Nurse', 'Tier 2', '1 Ipsum Close, Gwarinpa', 'Abuja', 28],
  ['Chukwudi Loremade', 'Sole Trader', 'Electronics Dealer', 'Tier 3', '44 Demo Alaba Market', 'Lagos', 60],
  ['Folake Ipsumbi', 'Individual', 'Caterer', 'Tier 1', '8 Fiction Ring Road', 'Ibadan', 22],
  ['Mockridge Gold & Gems Ltd', 'Nigerian Business', 'Dealers in Precious Metals & Stones', 'Tier 3', '14B Sample Odeku Street, Victoria Island', 'Lagos', 82],
  ['Sampleton Agro Exports Ltd', 'Nigerian Business', 'Import & Export Trading', 'Tier 3', '7 Demo Ogui Road', 'Enugu', 57],
  ['Loremville Micro Stores', 'Nigerian Business', 'Retail & FMCG', 'Tier 2', '29 Placeholder Allen Avenue, Ikeja', 'Lagos', 33],
  ['Placeholder Property Partners Ltd', 'Nigerian Business', 'Real Estate Development', 'Tier 3', '3 Ipsum Close, Maitama', 'Abuja', 76],
  ['Ipsum Faith Foundation', 'Nigerian Business', 'Non-profit / Religious Organisation', 'Tier 3', '12 Lorem Mission Road', 'Benin City', 54],
  ['Demovale Energy Services Ltd', 'Foreign Business', 'Declared: Oil & Gas Services', 'Tier 3', '5 Fiction Bourdillon Road, Ikoyi (NG branch)', 'Lagos', 96],
  ['RemitNova NG Settlement', 'IMTO Agent', 'IMTO settlement account', 'Tier 3', 'Settlement desk, Sample Broad Street', 'Lagos', 30],
  ['KinSwift NG Settlement', 'IMTO Agent', 'IMTO settlement account', 'Tier 3', 'Settlement desk, 14 Demo Odeku, Victoria Island', 'Lagos', 97],
  ['BridgeSend NG Settlement', 'IMTO Agent', 'IMTO settlement account', 'Tier 3', 'Settlement desk, 41 Fiction Broad Street', 'Lagos', 89],
  ['Diasporix NG Settlement', 'IMTO Agent', 'IMTO settlement account', 'Tier 3', 'Settlement desk, 9 Placeholder Danmole Street, V/I', 'Lagos', 92],
];

export const IMTO_OPERATORS = ['RemitNova', 'KinSwift', 'BridgeSend', 'Diasporix'] as const;

const level = (score: number): SeedCustomer['riskLevel'] => (score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low');

export const SEED_CUSTOMERS: SeedCustomer[] = SPECS.map(([fullName, entityType, occupation, kycTier, address, city, riskScore, status], i) => {
  const num = i + 1;
  const isBusiness = entityType === 'Nigerian Business' || entityType === 'Foreign Business' || entityType === 'IMTO Agent';
  const handle = fullName.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
  const birthYear = 1958 + ((num * 7) % 42);
  return {
    num,
    ref: `CUS-${pad(num, 4)}`,
    fullName,
    entityType,
    occupation,
    kycTier,
    bvn: `000${pad(num * 7919, 8)}`,
    nin: `000${pad(num * 104729, 8)}`,
    nuban: `99${pad(num * 1301, 8)}`,
    dob: isBusiness ? '—' : `${pad(1 + ((num * 3) % 28), 2)}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][num % 12]}-${birthYear}`,
    email: `${handle}@example.com`,
    phone: `+234 800 000 ${pad(num, 4)}`,
    address: `${address}, ${city}`,
    city,
    riskScore,
    riskLevel: level(riskScore),
    accountStatus: status ?? 'Active',
    bvnVerified: !occupation.startsWith('Unverified') && num !== 19,
    liveness: occupation.startsWith('Unverified') ? 'Pending' : num === 26 ? 'Fail' : 'Pass',
    cacNumber: entityType === 'Nigerian Business' ? `RC-000${pad(num * 37, 4)}` : undefined,
    imtoOperator: entityType === 'IMTO Agent' ? IMTO_OPERATORS[num - 37] : undefined,
  };
});

// The foreign business behind the phantom-payroll case carries its KYB block.
const demovale = SEED_CUSTOMERS[35];
demovale.foreignKYB = {
  countryOfRegistration: 'United Kingdom',
  companyRegistrationNumber: 'UK-CRN-00000036',
  beneficialOwners: [
    { id: 'bo-36-1', name: 'Zainab Placeholdu', ownershipPct: 55, pepStatus: 'Pending' },
    { id: 'bo-36-2', name: 'Halima Testimehin', ownershipPct: 25, pepStatus: 'Match' },
    { id: 'bo-36-3', name: 'Demovale Holdings (Nominee)', ownershipPct: 20, pepStatus: 'Clear' },
  ],
  declaredRemittancePurpose: 'Payroll',
  averageMonthlyTransferVolumeNGN: 48_000_000,
};

export const customerByNum = (num: number) => SEED_CUSTOMERS[num - 1];
