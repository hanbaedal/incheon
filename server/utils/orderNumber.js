"use strict";

const { formatYmdCompact } = require("./koreaTime");

// 주문번호: YYYYMMDD-#### (한국시간 당일 순번)
async function nextOrderNumber(OrderModel) {
  const prefix = formatYmdCompact();
  const count = await OrderModel.countDocuments({ orderNumber: new RegExp("^" + prefix) });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

module.exports = { nextOrderNumber };
