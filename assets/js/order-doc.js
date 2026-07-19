"use strict";

const DOC_SUPPLIER = {
  name: "근로복지공단 인천병원 장례식장",
  ceo: "",
  bizNo: "",
  address: "인천광역시 부평구 무네미로 446",
  phone: "032-205-1100",
};

const DOC_TITLES = {
  order: "주 문 서",
  statement: "거 래 명 세 서",
  tax: "세 금 계 산 서",
};

const DOC_STYLES = `
:root { --navy:#1f2a44; --line:#333; --soft:#f2f2ee; }
* { box-sizing: border-box; }
body { margin:0; font-family:"Malgun Gothic","Apple SD Gothic Neo",system-ui,sans-serif; color:#1a1a1a; font-size:13px; }
.doc-sheet { background:#fff; padding:18px 16px; }
.doc-title { text-align:center; font-size:28px; letter-spacing:14px; font-weight:800; color:var(--navy); margin:0 0 6px; padding-left:14px; }
.doc-sub { text-align:center; color:#666; margin:0 0 22px; font-size:12px; }
.meta { display:flex; justify-content:space-between; margin-bottom:14px; font-size:12.5px; flex-wrap:wrap; gap:8px; }
.parties { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
.party { flex:1; min-width:240px; border:1.5px solid var(--line); }
.party .h { background:var(--soft); text-align:center; font-weight:700; padding:6px; border-bottom:1px solid var(--line); }
.party table { width:100%; border-collapse:collapse; }
.party td { border:1px solid #bbb; padding:6px 8px; font-size:12px; }
.party td.k { background:#fafafa; width:70px; font-weight:600; color:#333; white-space:nowrap; }
table.items { width:100%; border-collapse:collapse; margin-bottom:16px; }
table.items th, table.items td { border:1px solid var(--line); padding:8px; font-size:12px; text-align:center; }
table.items th { background:var(--soft); }
table.items td.l { text-align:left; }
table.items td.r { text-align:right; }
table.items tfoot td { font-weight:700; background:#fbfbf8; }
.total-line { text-align:right; font-size:16px; font-weight:800; color:var(--navy); margin-top:6px; }
.memo { margin-top:16px; border:1px solid #bbb; padding:10px 12px; font-size:12px; min-height:44px; }
.memo b { color:var(--navy); }
.foot-note { margin-top:26px; text-align:center; color:#888; font-size:11px; }
`;

function docEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function docWon(n) {
  return (Number(n) || 0).toLocaleString("ko-KR") + "원";
}

function docFmtDate(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}년 ${p(d.getMonth() + 1)}월 ${p(d.getDate())}일`;
}

function docPartyTable(title, p, withBiz) {
  return `
    <div class="party">
      <div class="h">${title}</div>
      <table>
        <tr><td class="k">상호</td><td>${docEsc(p.name) || "-"}</td></tr>
        ${withBiz ? `<tr><td class="k">사업자번호</td><td>${docEsc(p.bizNo) || "-"}</td></tr>
        <tr><td class="k">대표자</td><td>${docEsc(p.ceo) || "-"}</td></tr>` : ""}
        <tr><td class="k">주소</td><td>${docEsc(p.address) || "-"}</td></tr>
        <tr><td class="k">연락처</td><td>${docEsc(p.phone) || "-"}</td></tr>
      </table>
    </div>`;
}

function docBuyerFromOrder(o) {
  return {
    name: (o.buyer && o.buyer.name) || (o.family && o.family.name) || "",
    ceo: (o.buyer && o.buyer.ceo) || "",
    bizNo: (o.buyer && o.buyer.bizNo) || "",
    address: (o.buyer && o.buyer.address) || (o.hall ? "빈소: " + o.hall.hallNumber : ""),
    phone: (o.buyer && o.buyer.phone) || (o.family && o.family.phone) || "",
  };
}

function docBuyerFromSummary(s) {
  return {
    name: (s.family && s.family.name) || "",
    ceo: "",
    bizNo: "",
    address: s.hall ? "빈소: " + s.hall.hallNumber : "",
    phone: (s.family && s.family.phone) || "",
  };
}

function docHallMemo(hall, memo) {
  if (memo) return docEsc(memo);
  if (!hall) return "-";
  let t = "빈소 " + docEsc(hall.hallNumber);
  if (hall.deceasedName) t += " / 故 " + docEsc(hall.deceasedName);
  if (hall.chiefMourner) t += " / 상주 " + docEsc(hall.chiefMourner);
  return t;
}

function buildOrderDocHtml(o, type) {
  type = type || "order";
  const isTax = type === "tax";
  const showTaxCols = type === "tax" || type === "statement";
  const buyer = docBuyerFromOrder(o);

  const rows = (o.items || []).map((it, i) => {
    const qty = it.settlementType === "postpaid" && it.settled && it.finalQty != null ? it.finalQty : it.qty;
    const supply = it.price * qty;
    const vat = it.taxable !== false ? Math.round(supply * 0.1) : 0;
    return `
      <tr>
        <td>${i + 1}</td>
        <td class="l">${docEsc(it.name)}</td>
        <td>${qty}${docEsc(it.unit)}</td>
        <td class="r">${docWon(it.price)}</td>
        <td class="r">${docWon(supply)}</td>
        ${showTaxCols ? `<td class="r">${docWon(vat)}</td>` : ""}
      </tr>`;
  }).join("");

  const colspanBase = 4;
  const footNote = isTax
    ? "※ 본 문서는 내부 관리용 참고 자료이며, 실제 세금계산서는 국세청 전자세금계산서로 발행됩니다."
    : "본 문서는 " + docEsc(DOC_SUPPLIER.name) + "에서 발행한 내부 관리 문서입니다.";

  return `
    <div class="doc-sheet">
      <h1 class="doc-title">${DOC_TITLES[type]}</h1>
      <p class="doc-sub">${docEsc(DOC_SUPPLIER.name)}</p>
      <div class="meta">
        <div>주문번호 : <b>${docEsc(o.orderNumber)}</b></div>
        <div>작성일자 : ${docFmtDate(o.createdAt)}</div>
      </div>
      <div class="parties">
        ${docPartyTable("공급자", DOC_SUPPLIER, true)}
        ${docPartyTable("공급받는자", buyer, isTax)}
      </div>
      <table class="items">
        <thead>
          <tr>
            <th style="width:36px">No</th><th>품목</th><th style="width:70px">수량</th>
            <th style="width:100px">단가</th><th style="width:110px">공급가액</th>
            ${showTaxCols ? '<th style="width:90px">세액</th>' : ""}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="${colspanBase}" class="r">공급가액 합계</td>
            <td class="r">${docWon(o.supplyAmount)}</td>
            ${showTaxCols ? `<td class="r">${docWon(o.vatAmount)}</td>` : ""}
          </tr>
          <tr>
            <td colspan="${showTaxCols ? 5 : 4}" class="r">합계금액 (VAT 포함)</td>
            <td class="r">${docWon(o.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="total-line">합계 금액 : ${docWon(o.totalAmount)}</div>
      <div class="memo"><b>비고</b> &nbsp; ${docHallMemo(o.hall, o.memo)}</div>
      <div class="foot-note">${footNote}<br />문의 : ${docEsc(DOC_SUPPLIER.phone)}</div>
    </div>`;
}

function buildAggregateDocHtml(s, type) {
  type = type || "order";
  const isTax = type === "tax";
  const showTaxCols = type === "tax" || type === "statement";
  const buyer = docBuyerFromSummary(s);
  const pending = s.summary.postpaidPending;
  const bill = s.summary.billable;

  const rows = (s.items || []).map((row, i) => {
    const qtyLabel = row.settlementType === "postpaid"
      ? (row.pending ? `${row.reservedQty} (미정산)` : row.settledQty)
      : row.reservedQty;
    return `
      <tr>
        <td>${i + 1}</td>
        <td class="l">${docEsc(row.name)}</td>
        <td>${qtyLabel}${docEsc(row.unit)}</td>
        <td class="r">${docWon(row.price)}</td>
        <td class="r">${row.pending ? "-" : docWon(row.supplyAmount)}</td>
        ${showTaxCols ? `<td class="r">${row.pending ? "-" : docWon(row.vatAmount)}</td>` : ""}
      </tr>`;
  }).join("");

  const footNote = isTax
    ? "※ 본 문서는 내부 관리용 참고 자료이며, 실제 세금계산서는 국세청 전자세금계산서로 발행됩니다."
    : "본 문서는 " + docEsc(DOC_SUPPLIER.name) + "에서 발행한 내부 관리 문서입니다.";

  const pendingMemo = pending.itemCount > 0
    ? `<div class="memo"><b>미정산 사후정산</b> &nbsp; ${pending.itemCount}건 · 예약 수량 ${pending.reservedQty}개 (발인 전 관리자 정산 후 반영)</div>`
    : "";

  return `
    <div class="doc-sheet">
      <h1 class="doc-title">${DOC_TITLES[type]}</h1>
      <p class="doc-sub">${docEsc(DOC_SUPPLIER.name)} · 취소 제외 주문 ${s.orderCount}건 합계</p>
      <div class="meta">
        <div>상주 : <b>${docEsc(buyer.name) || "-"}</b>${s.family && s.family.username ? " (" + docEsc(s.family.username) + ")" : ""}</div>
        <div>작성일자 : ${docFmtDate(new Date().toISOString())}</div>
      </div>
      <div class="parties">
        ${docPartyTable("공급자", DOC_SUPPLIER, true)}
        ${docPartyTable("공급받는자", buyer, isTax)}
      </div>
      <table class="items">
        <thead>
          <tr>
            <th style="width:36px">No</th><th>품목</th><th style="width:80px">수량</th>
            <th style="width:100px">단가</th><th style="width:110px">공급가액</th>
            ${showTaxCols ? '<th style="width:90px">세액</th>' : ""}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="r">공급가액 합계</td>
            <td class="r">${docWon(bill.supply)}</td>
            ${showTaxCols ? `<td class="r">${docWon(bill.vat)}</td>` : ""}
          </tr>
          <tr>
            <td colspan="${showTaxCols ? 5 : 4}" class="r">합계금액 (VAT 포함)</td>
            <td class="r">${docWon(bill.total)}</td>
          </tr>
        </tfoot>
      </table>
      <div class="total-line">합계 금액 : ${docWon(bill.total)}</div>
      ${pendingMemo}
      <div class="memo"><b>비고</b> &nbsp; ${docHallMemo(s.hall)}</div>
      <div class="foot-note">${footNote}<br />문의 : ${docEsc(DOC_SUPPLIER.phone)}</div>
    </div>`;
}

function printDocHtml(html, title) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("팝업이 차단되어 인쇄할 수 없습니다. 팝업 허용 후 다시 시도해 주세요.");
    return;
  }
  w.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8" /><title>${docEsc(title || "문서")}</title><style>${DOC_STYLES}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 300);
}
