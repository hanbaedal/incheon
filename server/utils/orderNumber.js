"use strict";

// 주문번호: YYYYMMDD-#### (당일 순번)
async function nextOrderNumber(OrderModel) {
  const now = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const prefix = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;
  const count = await OrderModel.countDocuments({ orderNumber: new RegExp("^" + prefix) });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

module.exports = { nextOrderNumber };
