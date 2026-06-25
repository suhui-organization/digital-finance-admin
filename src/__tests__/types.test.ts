import { ReviewItem } from "../lib/types";

describe("ReviewItem", () => {
  it("应正确创建审核记录项", () => {
    const item: ReviewItem = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      customerName: "张三",
      gender: "男",
      age: 35,
      loanAmount: 500000,
      creditStatus: "正常",
      aiScore: 85,
      aiRiskLevel: "低",
      canMatch: true,
      createdAt: "2025-01-15T10:30:00Z",
    };

    expect(item.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(item.customerName).toBe("张三");
    expect(item.age).toBe(35);
    expect(item.loanAmount).toBe(500000);
    expect(item.canMatch).toBe(true);
  });

  it("应允许 aiScore 和 aiRiskLevel 为 null", () => {
    const item: ReviewItem = {
      id: "test-id",
      customerName: "李四",
      gender: "女",
      age: 28,
      loanAmount: 300000,
      creditStatus: "正常",
      aiScore: null,
      aiRiskLevel: null,
      canMatch: false,
      createdAt: "2025-02-20T08:00:00Z",
    };

    expect(item.aiScore).toBeNull();
    expect(item.aiRiskLevel).toBeNull();
    expect(item.canMatch).toBe(false);
  });

  it("应包含所有必需字段", () => {
    const item: ReviewItem = {
      id: "",
      customerName: "",
      gender: "",
      age: 0,
      loanAmount: 0,
      creditStatus: "",
      aiScore: null,
      aiRiskLevel: null,
      canMatch: false,
      createdAt: "",
    };

    const requiredKeys = [
      "id",
      "customerName",
      "gender",
      "age",
      "loanAmount",
      "creditStatus",
      "aiScore",
      "aiRiskLevel",
      "canMatch",
      "createdAt",
    ];

    for (const key of requiredKeys) {
      expect(key in item).toBe(true);
    }
  });
});
