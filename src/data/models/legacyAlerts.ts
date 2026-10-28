export type AlertType =
  | "Structuring"
  | "PEP Match"
  | "Velocity Spike"
  | "Sanctions Hit"
  | "Round-Tripping"
  | "Threshold Breach";
export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Under Review" | "Escalated" | "Dismissed";

export interface TransactionEvent {
  id: string;
  date: string;
  type: string;
  amount: number;
  currency: string;
  counterparty: string;
  channel: string;
  flagReason?: string;
}

export interface AlertData {
  id: string;
  riskScore: number;
  customerName: string;
  customerId: string;
  customer360Id?: number;
  bvn: string;
  alertType: AlertType;
  timestamp: string;
  status: AlertStatus;
  kycTier: string;
  riskLevel: RiskLevel;
  accountNumber: string;
  totalFlagged: number;
  transactionTimeline: TransactionEvent[];
  summary: string;
}
