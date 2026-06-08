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

export const mockReviews: ReviewItem[] = [
  { id: "r1", customerName: "张三", gender: "男", age: 35, loanAmount: 500000, creditStatus: "正常", aiScore: 85, aiRiskLevel: "低", canMatch: true, createdAt: "2026-06-08T10:30:00Z" },
  { id: "r2", customerName: "李四", gender: "女", age: 28, loanAmount: 300000, creditStatus: "关注", aiScore: 60, aiRiskLevel: "中", canMatch: false, createdAt: "2026-06-08T09:15:00Z" },
  { id: "r3", customerName: "王五", gender: "男", age: 45, loanAmount: 800000, creditStatus: "正常", aiScore: 90, aiRiskLevel: "低", canMatch: true, createdAt: "2026-06-07T16:00:00Z" },
  { id: "r4", customerName: "赵六", gender: "女", age: 52, loanAmount: 200000, creditStatus: "当前逾期", aiScore: 25, aiRiskLevel: "极高", canMatch: false, createdAt: "2026-06-07T14:20:00Z" },
  { id: "r5", customerName: "孙七", gender: "男", age: 31, loanAmount: 600000, creditStatus: "正常", aiScore: 78, aiRiskLevel: "低", canMatch: true, createdAt: "2026-06-07T11:00:00Z" },
];