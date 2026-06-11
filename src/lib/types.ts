export interface ReviewItem {
  id: string;
  customerName: string;
  gender: string;
  age: number;
  loanAmount: number;
  creditStatus: string;
  aiScore: number | null;
  aiRiskLevel: string | null;
  canMatch: boolean;
  createdAt: string;
}
