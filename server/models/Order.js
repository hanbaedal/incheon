"use strict";

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ["product", "coffin", "hoengdae", "shroud", "accessory", "foodItem"], default: "product" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    itemRefId: { type: mongoose.Schema.Types.ObjectId, default: null },
    catKey: { type: String, default: "" },
    name: { type: String, required: true },
    unit: { type: String, default: "개" },
    price: { type: Number, required: true, min: 0 }, // 단가(공급가)
    qty: { type: Number, required: true, min: 1 },
    finalQty: { type: Number, default: null }, // 사후정산 실사용 수량
    settlementType: { type: String, enum: ["prepaid", "postpaid"], default: "prepaid" },
    settled: { type: Boolean, default: false },
    taxable: { type: Boolean, default: true },
  },
  { _id: false }
);

// 상주 주문 (주문서/거래명세서/세금계산서의 원천 데이터)
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // 예: 20260718-0001
    familyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", default: null },
    items: { type: [orderItemSchema], default: [] },
    // 금액(원 단위, 정수)
    supplyAmount: { type: Number, default: 0 }, // 공급가액
    vatAmount: { type: Number, default: 0 }, // 부가세
    totalAmount: { type: Number, default: 0 }, // 합계
    // 공급받는자(주문자/세금계산서용)
    buyer: {
      name: { type: String, default: "" }, // 상호/성명
      ceo: { type: String, default: "" }, // 대표자
      bizNo: { type: String, default: "" }, // 사업자등록번호
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "canceled"],
      default: "pending",
      index: true,
    },
    memo: { type: String, default: "" },
    postpaidSettledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.methods.recalcTotals = function recalcTotals() {
  let supply = 0;
  let vat = 0;
  for (const it of this.items) {
    let billQty = 0;
    if (it.settlementType === "postpaid") {
      if (it.settled && it.finalQty != null) billQty = Math.max(0, it.finalQty);
    } else {
      billQty = it.qty;
    }
    const line = Math.round(it.price * billQty);
    supply += line;
    if (it.taxable) vat += Math.round(line * 0.1);
  }
  this.supplyAmount = supply;
  this.vatAmount = vat;
  this.totalAmount = supply + vat;
  return this;
};

orderSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    id: this._id,
    orderNumber: this.orderNumber,
    familyUserId: this.familyUserId,
    hallId: this.hallId,
    items: this.items,
    supplyAmount: this.supplyAmount,
    vatAmount: this.vatAmount,
    totalAmount: this.totalAmount,
    buyer: this.buyer,
    status: this.status,
    memo: this.memo,
    postpaidSettledAt: this.postpaidSettledAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
