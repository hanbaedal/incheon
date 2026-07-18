"use strict";

const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireFamily, requireAuth } = require("../middleware/auth");
const { nextOrderNumber } = require("../utils/orderNumber");

const router = express.Router();

// 상주: 주문 생성
router.post(
  "/",
  requireFamily,
  asyncHandler(async (req, res) => {
    const { items, buyer, memo } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "주문 항목이 없습니다." });
    }
    // 상품 정보를 서버에서 다시 조회(가격 위변조 방지)
    const ids = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: ids }, active: true });
    const map = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = [];
    for (const it of items) {
      const p = map.get(String(it.productId));
      if (!p) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 상품이 포함되어 있습니다." });
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      orderItems.push({ productId: p._id, name: p.name, unit: p.unit, price: p.price, qty, taxable: p.taxable });
    }

    const me = await User.findById(req.user.uid);
    const order = new Order({
      orderNumber: await nextOrderNumber(Order),
      familyUserId: req.user.uid,
      hallId: (me && me.hallId) || null,
      items: orderItems,
      buyer: {
        name: (buyer && buyer.name) || (me && me.name) || "",
        ceo: (buyer && buyer.ceo) || "",
        bizNo: (buyer && buyer.bizNo) || "",
        address: (buyer && buyer.address) || "",
        phone: (buyer && buyer.phone) || (me && me.phone) || "",
        email: (buyer && buyer.email) || "",
      },
      memo: memo || "",
    });
    order.recalcTotals();
    await order.save();
    res.status(201).json({ order: order.toJSONSafe() });
  })
);

// 상주: 내 주문 목록
router.get(
  "/mine",
  requireFamily,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ familyUserId: req.user.uid }).sort({ createdAt: -1 });
    res.json({ items: orders.map((o) => o.toJSONSafe()) });
  })
);

// 관리자: 전체 주문
router.get(
  "/admin/all",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("familyUserId", "name username")
      .populate("hallId", "hallNumber deceasedName");
    res.json({
      items: orders.map((o) => ({
        ...o.toJSONSafe(),
        family: o.familyUserId ? { id: o.familyUserId._id, name: o.familyUserId.name, username: o.familyUserId.username } : null,
        hall: o.hallId ? { id: o.hallId._id, hallNumber: o.hallId.hallNumber, deceasedName: o.hallId.deceasedName } : null,
      })),
    });
  })
);

// 주문 단건 (문서 출력용) — 상주는 본인 주문만, 관리자는 전체
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate("familyUserId", "name username phone")
      .populate("hallId", "hallNumber deceasedName chiefMourner");
    if (!order) return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    if (req.user.role !== "admin" && String(order.familyUserId._id) !== req.user.uid) {
      return res.status(403).json({ error: "본인 주문만 조회할 수 있습니다." });
    }
    res.json({
      order: {
        ...order.toJSONSafe(),
        family: order.familyUserId ? { name: order.familyUserId.name, username: order.familyUserId.username, phone: order.familyUserId.phone } : null,
        hall: order.hallId ? { hallNumber: order.hallId.hallNumber, deceasedName: order.hallId.deceasedName, chiefMourner: order.hallId.chiefMourner } : null,
      },
    });
  })
);

// 관리자: 주문 상태/메모 수정
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, memo } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
    if (status) order.status = status;
    if (typeof memo === "string") order.memo = memo;
    await order.save();
    res.json({ order: order.toJSONSafe() });
  })
);

module.exports = router;
