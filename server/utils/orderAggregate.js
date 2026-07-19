"use strict";

function lineAmount(it, qty) {
  const q = Math.max(0, qty || 0);
  const supply = Math.round(it.price * q);
  const vat = it.taxable !== false ? Math.round(supply * 0.1) : 0;
  return { supply, vat, total: supply + vat, qty: q };
}

function aggregateOrders(orders) {
  const active = (orders || []).filter((o) => o.status !== "canceled");
  const itemMap = new Map();

  for (const order of active) {
    for (const it of order.items || []) {
      const key = [it.name, it.unit || "", it.price, it.settlementType || "prepaid"].join("|");
      let row = itemMap.get(key);
      if (!row) {
        row = {
          name: it.name,
          unit: it.unit || "개",
          price: it.price,
          settlementType: it.settlementType || "prepaid",
          catKey: it.catKey || "",
          reservedQty: 0,
          settledQty: 0,
          supplyAmount: 0,
          vatAmount: 0,
          totalAmount: 0,
          pending: false,
        };
        itemMap.set(key, row);
      }
      row.reservedQty += it.qty || 0;
      if (it.settlementType === "postpaid") {
        if (it.settled && it.finalQty != null) {
          row.settledQty += Math.max(0, it.finalQty);
        } else {
          row.pending = true;
        }
      }
    }
  }

  const items = Array.from(itemMap.values()).map((row) => {
    if (row.settlementType === "postpaid") {
      const amt = lineAmount(row, row.settledQty);
      row.supplyAmount = amt.supply;
      row.vatAmount = amt.vat;
      row.totalAmount = amt.total;
    } else {
      const amt = lineAmount(row, row.reservedQty);
      row.supplyAmount = amt.supply;
      row.vatAmount = amt.vat;
      row.totalAmount = amt.total;
    }
    return row;
  });

  items.sort((a, b) => {
    if (a.settlementType !== b.settlementType) return a.settlementType === "prepaid" ? -1 : 1;
    return a.name.localeCompare(b.name, "ko");
  });

  const summary = {
    prepaid: { supply: 0, vat: 0, total: 0 },
    postpaidSettled: { supply: 0, vat: 0, total: 0 },
    postpaidPending: { itemCount: 0, reservedQty: 0 },
    billable: { supply: 0, vat: 0, total: 0 },
    orderCount: active.length,
  };

  for (const row of items) {
    if (row.settlementType === "postpaid") {
      summary.postpaidSettled.supply += row.supplyAmount;
      summary.postpaidSettled.vat += row.vatAmount;
      summary.postpaidSettled.total += row.totalAmount;
      if (row.pending) {
        summary.postpaidPending.itemCount += 1;
        summary.postpaidPending.reservedQty += row.reservedQty;
      }
    } else {
      summary.prepaid.supply += row.supplyAmount;
      summary.prepaid.vat += row.vatAmount;
      summary.prepaid.total += row.totalAmount;
    }
  }

  summary.billable.supply = summary.prepaid.supply + summary.postpaidSettled.supply;
  summary.billable.vat = summary.prepaid.vat + summary.postpaidSettled.vat;
  summary.billable.total = summary.prepaid.total + summary.postpaidSettled.total;

  return {
    orderCount: active.length,
    orders: active.map((o) => ({
      id: o.id || o._id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      itemCount: (o.items || []).length,
      totalAmount: o.totalAmount,
      supplyAmount: o.supplyAmount,
    })),
    items,
    summary,
  };
}

module.exports = { aggregateOrders, lineAmount };
