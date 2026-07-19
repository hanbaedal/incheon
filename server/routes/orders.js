"use strict";

const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coffin = require("../models/Coffin");
const Hoengdae = require("../models/Hoengdae");
const Shroud = require("../models/Shroud");
const Accessory = require("../models/Accessory");
const FoodItem = require("../models/FoodItem");
const FlowerItem = require("../models/FlowerItem");
const PhotoItem = require("../models/PhotoItem");
const DressItem = require("../models/DressItem");
const HearseItem = require("../models/HearseItem");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireFamily, requireAuth } = require("../middleware/auth");
const { nextOrderNumber } = require("../utils/orderNumber");
const { aggregateOrders } = require("../utils/orderAggregate");

const router = express.Router();

function resolveItemType(it) {
  if (["coffin", "hoengdae", "shroud", "accessory", "foodItem", "flowerItem", "photoItem", "dressItem", "hearseItem"].includes(it.itemType)) return it.itemType;
  if (it.coffinId) return "coffin";
  if (it.hoengdaeId) return "hoengdae";
  if (it.shroudId) return "shroud";
  if (it.accessoryId) return "accessory";
  if (it.foodItemId) return "foodItem";
  if (it.flowerItemId) return "flowerItem";
  if (it.photoItemId) return "photoItem";
  if (it.dressItemId) return "dressItem";
  if (it.hearseItemId) return "hearseItem";
  return "product";
}

function resolveRefId(it, itemType) {
  if (itemType === "coffin") return it.itemRefId || it.coffinId;
  if (itemType === "hoengdae") return it.itemRefId || it.hoengdaeId;
  if (itemType === "shroud") return it.itemRefId || it.shroudId;
  if (itemType === "accessory") return it.itemRefId || it.accessoryId;
  if (itemType === "foodItem") return it.itemRefId || it.foodItemId;
  if (itemType === "flowerItem") return it.itemRefId || it.flowerItemId;
  if (itemType === "photoItem") return it.itemRefId || it.photoItemId;
  if (itemType === "dressItem") return it.itemRefId || it.dressItemId;
  if (itemType === "hearseItem") return it.itemRefId || it.hearseItemId;
  return it.productId;
}

function orderItemFromFood(ref, qty) {
  const isPostpaid = ref.settlementType === "postpaid";
  return {
    itemType: "foodItem",
    itemRefId: ref._id,
    catKey: "food",
    name: ref.name,
    unit: ref.unit || "개",
    price: ref.price,
    qty,
    finalQty: isPostpaid ? null : qty,
    settlementType: ref.settlementType || "prepaid",
    settled: !isPostpaid,
    taxable: ref.taxable,
  };
}

function prepaidItem(itemType, ref, catKey, qty) {
  const name = itemType === "dressItem" && ref.spec ? `${ref.name} ${ref.spec}` : ref.name;
  return {
    itemType,
    itemRefId: ref._id,
    catKey,
    name,
    unit: ref.unit || "개",
    price: ref.price,
    qty,
    finalQty: qty,
    settlementType: "prepaid",
    settled: true,
    taxable: ref.taxable,
  };
}

// 상주: 주문(예약) 생성
router.post(
  "/",
  requireFamily,
  asyncHandler(async (req, res) => {
    const { items, buyer, memo } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "예약 항목이 없습니다." });
    }

    const productIds = [];
    const coffinIds = [];
    const hoengdaeIds = [];
    const shroudIds = [];
    const accessoryIds = [];
    const foodItemIds = [];
    const flowerItemIds = [];
    const photoItemIds = [];
    const dressItemIds = [];
    const hearseItemIds = [];
    for (const it of items) {
      const itemType = resolveItemType(it);
      const refId = resolveRefId(it, itemType);
      if (!refId) return res.status(400).json({ error: "품목 ID가 누락되었습니다." });
      if (itemType === "coffin") coffinIds.push(refId);
      else if (itemType === "hoengdae") hoengdaeIds.push(refId);
      else if (itemType === "shroud") shroudIds.push(refId);
      else if (itemType === "accessory") accessoryIds.push(refId);
      else if (itemType === "foodItem") foodItemIds.push(refId);
      else if (itemType === "flowerItem") flowerItemIds.push(refId);
      else if (itemType === "photoItem") photoItemIds.push(refId);
      else if (itemType === "dressItem") dressItemIds.push(refId);
      else if (itemType === "hearseItem") hearseItemIds.push(refId);
      else productIds.push(refId);
    }

    const [products, coffins, hoengdaes, shrouds, accessories, foodItems, flowerItems, photoItems, dressItems, hearseItems] = await Promise.all([
      productIds.length ? Product.find({ _id: { $in: productIds }, active: true }) : [],
      coffinIds.length ? Coffin.find({ _id: { $in: coffinIds }, active: true }) : [],
      hoengdaeIds.length ? Hoengdae.find({ _id: { $in: hoengdaeIds }, active: true }) : [],
      shroudIds.length ? Shroud.find({ _id: { $in: shroudIds }, active: true }) : [],
      accessoryIds.length ? Accessory.find({ _id: { $in: accessoryIds }, active: true }) : [],
      foodItemIds.length ? FoodItem.find({ _id: { $in: foodItemIds }, active: true }) : [],
      flowerItemIds.length ? FlowerItem.find({ _id: { $in: flowerItemIds }, active: true }) : [],
      photoItemIds.length ? PhotoItem.find({ _id: { $in: photoItemIds }, active: true }) : [],
      dressItemIds.length ? DressItem.find({ _id: { $in: dressItemIds }, active: true }) : [],
      hearseItemIds.length ? HearseItem.find({ _id: { $in: hearseItemIds }, active: true }) : [],
    ]);
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const coffinMap = new Map(coffins.map((c) => [String(c._id), c]));
    const hoengdaeMap = new Map(hoengdaes.map((h) => [String(h._id), h]));
    const shroudMap = new Map(shrouds.map((s) => [String(s._id), s]));
    const accessoryMap = new Map(accessories.map((a) => [String(a._id), a]));
    const foodItemMap = new Map(foodItems.map((f) => [String(f._id), f]));
    const flowerItemMap = new Map(flowerItems.map((f) => [String(f._id), f]));
    const photoItemMap = new Map(photoItems.map((p) => [String(p._id), p]));
    const dressItemMap = new Map(dressItems.map((d) => [String(d._id), d]));
    const hearseItemMap = new Map(hearseItems.map((h) => [String(h._id), h]));

    const orderItems = [];
    for (const it of items) {
      const itemType = resolveItemType(it);
      const refId = resolveRefId(it, itemType);
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);

      if (itemType === "coffin") {
        const c = coffinMap.get(String(refId));
        if (!c) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 관 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("coffin", c, "coffin", qty));
      } else if (itemType === "hoengdae") {
        const h = hoengdaeMap.get(String(refId));
        if (!h) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 횡대 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("hoengdae", h, "coffin", qty));
      } else if (itemType === "shroud") {
        const s = shroudMap.get(String(refId));
        if (!s) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 수의 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("shroud", s, "shroud", qty));
      } else if (itemType === "accessory") {
        const a = accessoryMap.get(String(refId));
        if (!a) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 부속물품이 포함되어 있습니다." });
        orderItems.push(prepaidItem("accessory", a, "etc", qty));
      } else if (itemType === "foodItem") {
        const f = foodItemMap.get(String(refId));
        if (!f) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 음식 품목이 포함되어 있습니다." });
        orderItems.push(orderItemFromFood(f, qty));
      } else if (itemType === "flowerItem") {
        const fl = flowerItemMap.get(String(refId));
        if (!fl) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 화환 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("flowerItem", fl, "flower", qty));
      } else if (itemType === "photoItem") {
        const ph = photoItemMap.get(String(refId));
        if (!ph) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 사진 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("photoItem", ph, "photo", qty));
      } else if (itemType === "dressItem") {
        const dr = dressItemMap.get(String(refId));
        if (!dr) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 상복 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("dressItem", dr, "dress", qty));
      } else if (itemType === "hearseItem") {
        const hr = hearseItemMap.get(String(refId));
        if (!hr) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 운구·차량 품목이 포함되어 있습니다." });
        orderItems.push(prepaidItem("hearseItem", hr, "hearse", qty));
      } else {
        const p = productMap.get(String(refId));
        if (!p) return res.status(400).json({ error: "존재하지 않거나 판매 종료된 상품이 포함되어 있습니다." });
        const isPostpaid = p.settlementType === "postpaid";
        orderItems.push({
          itemType: "product",
          productId: p._id,
          itemRefId: p._id,
          catKey: p.catKey,
          name: p.name,
          unit: p.unit,
          price: p.price,
          qty,
          finalQty: isPostpaid ? null : qty,
          settlementType: p.settlementType || "prepaid",
          settled: !isPostpaid,
          taxable: p.taxable,
        });
      }
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

// 상주: 발인 전 주문 집계
router.get(
  "/mine/summary",
  requireFamily,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ familyUserId: req.user.uid }).sort({ createdAt: 1 });
    const me = await User.findById(req.user.uid).populate("hallId", "hallNumber deceasedName chiefMourner");
    const agg = aggregateOrders(orders.map((o) => o.toJSONSafe()));
    res.json({
      ...agg,
      family: me ? { name: me.name, username: me.username, phone: me.phone } : null,
      hall: me && me.hallId
        ? { hallNumber: me.hallId.hallNumber, deceasedName: me.hallId.deceasedName, chiefMourner: me.hallId.chiefMourner }
        : null,
    });
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

// 관리자: 상주별 주문 집계
router.get(
  "/admin/summary",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { familyUserId } = req.query || {};
    if (!familyUserId) return res.status(400).json({ error: "상주 계정 ID가 필요합니다." });
    const family = await User.findById(familyUserId).populate("hallId", "hallNumber deceasedName chiefMourner");
    if (!family) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
    const orders = await Order.find({ familyUserId }).sort({ createdAt: 1 });
    const agg = aggregateOrders(orders.map((o) => o.toJSONSafe()));
    res.json({
      ...agg,
      family: { id: family._id, name: family.name, username: family.username, phone: family.phone },
      hall: family.hallId
        ? { hallNumber: family.hallId.hallNumber, deceasedName: family.hallId.deceasedName, chiefMourner: family.hallId.chiefMourner }
        : null,
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
    if (req.user.role !== "admin") {
      const ownerId = order.familyUserId && order.familyUserId._id;
      if (!ownerId || String(ownerId) !== req.user.uid) {
        return res.status(403).json({ error: "본인 주문만 조회할 수 있습니다." });
      }
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

// 관리자: 사후정산 (발인 전 수기 정산)
router.patch(
  "/:id/settle",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "정산할 품목 정보가 없습니다." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "주문을 찾을 수 없습니다." });

    const settleMap = new Map(
      items.map((it) => {
        const key = it.index != null ? String(it.index) : String(it.productId || it.itemRefId);
        return [key, it];
      })
    );
    let changed = false;

    order.items.forEach((it, idx) => {
      if (it.settlementType !== "postpaid") return;
      const input = settleMap.get(String(idx)) || settleMap.get(String(it.productId)) || settleMap.get(String(it.itemRefId));
      if (!input) return;
      const finalQty = Math.max(0, parseInt(input.finalQty, 10) || 0);
      it.finalQty = finalQty;
      it.settled = true;
      changed = true;
    });

    if (!changed) return res.status(400).json({ error: "정산할 사후정산 품목이 없습니다." });

    const allPostpaidSettled = order.items
      .filter((it) => it.settlementType === "postpaid")
      .every((it) => it.settled);
    if (allPostpaidSettled) order.postpaidSettledAt = new Date();

    order.recalcTotals();
    await order.save();
    res.json({ order: order.toJSONSafe() });
  })
);

module.exports = router;
