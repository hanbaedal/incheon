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
const ServicePrice = require("../models/ServicePrice");
const HallFacilityFee = require("../models/HallFacilityFee");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { requireAdmin, requireFamily, requireAuth } = require("../middleware/auth");
const { nextOrderNumber } = require("../utils/orderNumber");
const { aggregateOrders } = require("../utils/orderAggregate");
const { buildHallSnapshotFromUsage, hallSnapshotToSummary, usageToHallSummary } = require("../utils/hallFormat");
const { orderHallForDisplay } = require("../utils/orderHallSnapshot");
const { appendHallFeeOrderItem } = require("../utils/hallOrderItem");
const HallUsage = require("../models/HallUsage");

const router = express.Router();

function summaryHallFromOrders(orders, usage, hall) {
  const first = orders.find((o) => o.hallSnapshot && o.hallSnapshot.hallNumber);
  if (first) return hallSnapshotToSummary(first.hallSnapshot);
  return usageToHallSummary(usage, hall);
}

function resolveItemType(it) {
  if (["coffin", "hoengdae", "shroud", "accessory", "foodItem", "flowerItem", "photoItem", "dressItem", "hearseItem", "servicePrice", "hallFacilityFee"].includes(it.itemType)) return it.itemType;
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
  if (itemType === "servicePrice") return it.itemRefId || it.servicePriceId;
  if (itemType === "hallFacilityFee") return it.itemRefId || it.hallFacilityFeeId;
  return it.productId;
}

function orderItemFromFood(ref, qty) {
  const isPostpaid = ref.settlementType === "postpaid";
  return {
    itemType: "foodItem",
    itemRefId: ref._id,
    catKey: "food",
    foodCategory: ref.foodCategory || "",
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

function orderItemFromServicePrice(ref, qty) {
  const isPostpaid = ref.settlementType === "postpaid";
  const label = ref.group && ref.group !== ref.name ? `${ref.group} · ${ref.name}` : ref.name;
  return {
    itemType: "servicePrice",
    itemRefId: ref._id,
    catKey: "service",
    name: label,
    unit: ref.unit || "-",
    price: ref.price,
    qty,
    finalQty: isPostpaid ? null : qty,
    settlementType: ref.settlementType || "prepaid",
    settled: !isPostpaid,
    taxable: ref.taxable,
  };
}

function orderItemFromHallFacilityFee(ref, qty) {
  const isPostpaid = ref.settlementType === "postpaid";
  const label = ref.name && ref.name !== "-" ? `${ref.group} · ${ref.name}` : ref.group;
  return {
    itemType: "hallFacilityFee",
    itemRefId: ref._id,
    catKey: "facility",
    name: label,
    unit: ref.unit || "1일",
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
    const rawItems = Array.isArray(items) ? items : [];
    const me = await User.findById(req.user.uid);

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
    const servicePriceIds = [];
    const hallFacilityFeeIds = [];
    for (const it of rawItems) {
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
      else if (itemType === "servicePrice") servicePriceIds.push(refId);
      else if (itemType === "hallFacilityFee") hallFacilityFeeIds.push(refId);
      else productIds.push(refId);
    }

    const [products, coffins, hoengdaes, shrouds, accessories, foodItems, flowerItems, photoItems, dressItems, hearseItems, servicePrices, hallFacilityFees] = await Promise.all([
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
      servicePriceIds.length ? ServicePrice.find({ _id: { $in: servicePriceIds }, active: true, orderable: true }) : [],
      hallFacilityFeeIds.length ? HallFacilityFee.find({ _id: { $in: hallFacilityFeeIds }, active: true, orderable: true }) : [],
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
    const servicePriceMap = new Map(servicePrices.map((s) => [String(s._id), s]));
    const hallFacilityFeeMap = new Map(hallFacilityFees.map((f) => [String(f._id), f]));

    const orderItems = [];
    for (const it of rawItems) {
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
      } else if (itemType === "servicePrice") {
        const sp = servicePriceMap.get(String(refId));
        if (!sp) return res.status(400).json({ error: "존재하지 않거나 청구 불가한 서비스 항목이 포함되어 있습니다." });
        orderItems.push(orderItemFromServicePrice(sp, qty));
      } else if (itemType === "hallFacilityFee") {
        const ff = hallFacilityFeeMap.get(String(refId));
        if (!ff) return res.status(400).json({ error: "존재하지 않거나 청구 불가한 시설 사용료 항목이 포함되어 있습니다." });
        orderItems.push(orderItemFromHallFacilityFee(ff, qty));
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

    await appendHallFeeOrderItem(orderItems, req.user.uid, me && me.hallUsageId);
    if (orderItems.length === 0) {
      return res.status(400).json({ error: "예약 항목이 없습니다." });
    }

    let hallSnapshot = null;
    if (me && me.hallUsageId) {
      const usage = await HallUsage.findById(me.hallUsageId).populate("hallId");
      if (usage) hallSnapshot = buildHallSnapshotFromUsage(usage, usage.hallId);
    }

    const order = new Order({
      orderNumber: await nextOrderNumber(Order),
      familyUserId: req.user.uid,
      hallUsageId: (me && me.hallUsageId) || null,
      hallSnapshot: hallSnapshot || undefined,
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
    const safe = order.toJSONSafe();
    res.status(201).json({
      order: {
        ...safe,
        hall: orderHallForDisplay(safe, null, null),
      },
    });
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
    const me = await User.findById(req.user.uid).populate({ path: "hallUsageId", populate: { path: "hallId" } });
    const safeOrders = orders.map((o) => o.toJSONSafe());
    const agg = aggregateOrders(safeOrders);
    res.json({
      ...agg,
      family: me ? { name: me.name, username: me.username, phone: me.phone } : null,
      hall: summaryHallFromOrders(safeOrders, me && me.hallUsageId, me && me.hallUsageId && me.hallUsageId.hallId),
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
      .populate({ path: "hallUsageId", populate: { path: "hallId" } });
    res.json({
      items: orders.map((o) => {
        const safe = o.toJSONSafe();
        return {
          ...safe,
          family: o.familyUserId ? { id: o.familyUserId._id, name: o.familyUserId.name, username: o.familyUserId.username } : null,
          hall: orderHallForDisplay(safe, o.hallUsageId, o.hallUsageId && o.hallUsageId.hallId),
        };
      }),
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
    const family = await User.findById(familyUserId).populate({ path: "hallUsageId", populate: { path: "hallId" } });
    if (!family) return res.status(404).json({ error: "상주 계정을 찾을 수 없습니다." });
    const orders = await Order.find({ familyUserId }).sort({ createdAt: 1 });
    const safeOrders = orders.map((o) => o.toJSONSafe());
    const agg = aggregateOrders(safeOrders);
    res.json({
      ...agg,
      family: { id: family._id, name: family.name, username: family.username, phone: family.phone },
      hall: summaryHallFromOrders(safeOrders, family.hallUsageId, family.hallUsageId && family.hallUsageId.hallId),
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
      .populate({ path: "hallUsageId", populate: { path: "hallId" } });
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
        hall: orderHallForDisplay(order.toJSONSafe(), order.hallUsageId, order.hallUsageId && order.hallUsageId.hallId),
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
