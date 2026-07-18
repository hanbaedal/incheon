"use strict";

/*
 * 백엔드 스모크 테스트
 * - 인메모리 MongoDB(mongodb-memory-server) 기동
 * - 관리자 계정 생성 → 로그인 → 권한/CRUD 검증
 * 실행: npm run test:smoke
 */

const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log("  ✓ " + name);
}

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  const { connectDB, disconnectDB } = require("../config/db");
  const { createApp } = require("../app");
  const User = require("../models/User");

  await connectDB(uri);

  // 관리자 계정 생성
  const admin = new User({ username: "admin", role: "admin", name: "관리자" });
  await admin.setPassword("admin1234");
  await admin.save();
  // 상주 계정 생성
  const family = new User({ username: "sangju1", role: "family", name: "홍길동" });
  await family.setPassword("family1234");
  await family.save();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  let cookie = "";
  const jsonHeaders = () => ({
    "Content-Type": "application/json",
    ...(cookie ? { Cookie: cookie } : {}),
  });

  try {
    // health
    let r = await fetch(`${base}/api/health`);
    assert.strictEqual(r.status, 200);
    ok("GET /api/health 200");

    // 정적 index.html 서빙
    r = await fetch(`${base}/index.html`);
    assert.strictEqual(r.status, 200);
    const html = await r.text();
    assert.ok(/근로복지공단/.test(html), "index.html 내용");
    ok("정적 index.html 서빙");

    // 민감 경로 차단
    r = await fetch(`${base}/server/config/env.js`);
    assert.strictEqual(r.status, 404);
    ok("민감 경로(/server) 차단 404");

    // 비로그인 상태로 공지 생성 시 401
    r = await fetch(`${base}/api/notices`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ title: "x", content: "y" }),
    });
    assert.strictEqual(r.status, 401);
    ok("비로그인 공지 생성 401");

    // 잘못된 로그인
    r = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    });
    assert.strictEqual(r.status, 401);
    ok("잘못된 비밀번호 로그인 401");

    // 관리자 로그인
    r = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ username: "admin", password: "admin1234" }),
    });
    assert.strictEqual(r.status, 200);
    const setCookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
    cookie = setCookies.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
    assert.ok(cookie.includes("session_token"), "세션 쿠키 발급");
    ok("관리자 로그인 + 쿠키 발급");

    // me
    r = await fetch(`${base}/api/auth/me`, { headers: jsonHeaders() });
    let data = await r.json();
    assert.strictEqual(r.status, 200);
    assert.strictEqual(data.user.role, "admin");
    ok("GET /api/auth/me (admin)");

    // 공지 생성
    r = await fetch(`${base}/api/notices`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ title: "공지 제목", content: "공지 내용", pinned: true }),
    });
    data = await r.json();
    assert.strictEqual(r.status, 201);
    const noticeId = data.notice.id;
    ok("관리자 공지 생성 201");

    // 공지 공개 목록
    r = await fetch(`${base}/api/notices`);
    data = await r.json();
    assert.strictEqual(data.total, 1);
    ok("공지 공개 목록 조회");

    // 공지 상세(조회수 증가)
    r = await fetch(`${base}/api/notices/${noticeId}`);
    data = await r.json();
    assert.strictEqual(data.notice.views, 1);
    ok("공지 상세 조회수 증가");

    // 빈소 등록
    r = await fetch(`${base}/api/halls`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ hallNumber: "1호실", deceasedName: "김철수", chiefMourner: "김영희", status: "in-use" }),
    });
    data = await r.json();
    assert.strictEqual(r.status, 201);
    assert.ok(data.hall.familyCode, "familyCode 자동 생성");
    const hallId = data.hall.id;
    ok("관리자 빈소 등록 + familyCode 생성");

    // 공개 빈소 목록에는 familyCode 없어야 함
    r = await fetch(`${base}/api/halls`);
    data = await r.json();
    assert.ok(data.items.length === 1 && data.items[0].familyCode === undefined);
    ok("공개 빈소 목록 familyCode 제외");

    // 추모글 등록(공개)
    r = await fetch(`${base}/api/memorials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hallId, author: "이웃", message: "삼가 고인의 명복을 빕니다.", password: "1234" }),
    });
    assert.strictEqual(r.status, 201);
    ok("추모글 등록 201");

    // 추모글 목록
    r = await fetch(`${base}/api/memorials?hallId=${hallId}`);
    data = await r.json();
    assert.strictEqual(data.items.length, 1);
    ok("추모글 목록 조회");

    // 온라인 문의 등록(비공개)
    r = await fetch(`${base}/api/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "박문의", title: "빈소 문의", message: "문의합니다", isPrivate: true, password: "9999" }),
    });
    data = await r.json();
    assert.strictEqual(r.status, 201);
    const inqId = data.id;
    ok("온라인 문의 등록(비공개) 201");

    // 비공개 문의 목록 제목 마스킹
    r = await fetch(`${base}/api/inquiries`);
    data = await r.json();
    assert.strictEqual(data.items[0].title, "비공개 문의입니다.");
    ok("비공개 문의 제목 마스킹");

    // 비밀번호 없이 상세 → 403
    r = await fetch(`${base}/api/inquiries/${inqId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(r.status, 403);
    ok("비공개 문의 비밀번호 없이 403");

    // 관리자 문의 답변
    r = await fetch(`${base}/api/inquiries/${inqId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ answer: "안내드립니다." }),
    });
    data = await r.json();
    assert.strictEqual(data.inquiry.status, "answered");
    ok("관리자 문의 답변 → answered");

    // 상주 로그인 후 공지 생성 시 403
    const r2 = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sangju1", password: "family1234" }),
    });
    const famCookies = r2.headers.getSetCookie ? r2.headers.getSetCookie() : [r2.headers.get("set-cookie")];
    const famCookie = famCookies.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
    r = await fetch(`${base}/api/notices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: famCookie },
      body: JSON.stringify({ title: "x", content: "y" }),
    });
    assert.strictEqual(r.status, 403);
    ok("상주 계정 공지 생성 시도 403");

    // ── 상품·상주계정·주문 ──────────────────────────────────
    // 관리자: 상품 생성 (과세)
    r = await fetch(`${base}/api/products`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ category: "관·수의", name: "오동나무 관", price: 300000, unit: "개", taxable: true }),
    });
    data = await r.json();
    assert.strictEqual(r.status, 201);
    const productId = data.product.id;
    ok("관리자 상품 생성 201");

    // 공개 상품 목록
    r = await fetch(`${base}/api/products`);
    data = await r.json();
    assert.ok(data.items.length === 1 && data.items[0].id === productId);
    ok("공개 상품 목록 조회");

    // 관리자: 상주 계정 생성(빈소 연결)
    r = await fetch(`${base}/api/users`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ username: "sangju2", name: "김상주", phone: "010-1111-2222", password: "pass1234", hallId }),
    });
    data = await r.json();
    assert.strictEqual(r.status, 201);
    assert.strictEqual(data.user.role, "family");
    ok("관리자 상주 계정 생성 201");

    // 관리자: 상주 계정 목록
    r = await fetch(`${base}/api/users/admin/all`, { headers: jsonHeaders() });
    data = await r.json();
    assert.ok(data.items.some((u) => u.username === "sangju2" && u.hall && u.hall.id));
    ok("상주 계정 목록(빈소 연결 포함)");

    // 신규 상주 로그인
    r = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sangju2", password: "pass1234" }),
    });
    const fam2Cookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
    const fam2Cookie = fam2Cookies.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
    assert.ok(fam2Cookie.includes("session_token"));
    ok("신규 상주 로그인");

    // 상주: 주문 생성 (수량 2 → 공급가 60만, 부가세 6만, 합계 66만)
    r = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: fam2Cookie },
      body: JSON.stringify({ items: [{ productId, qty: 2 }], memo: "빈소로 배송" }),
    });
    data = await r.json();
    assert.strictEqual(r.status, 201);
    assert.strictEqual(data.order.supplyAmount, 600000);
    assert.strictEqual(data.order.vatAmount, 60000);
    assert.strictEqual(data.order.totalAmount, 660000);
    assert.ok(/^\d{8}-\d{4}$/.test(data.order.orderNumber), "주문번호 형식");
    const orderId = data.order.id;
    ok("상주 주문 생성 + 금액/주문번호");

    // 상주: 내 주문 목록
    r = await fetch(`${base}/api/orders/mine`, { headers: { Cookie: fam2Cookie } });
    data = await r.json();
    assert.strictEqual(data.items.length, 1);
    ok("상주 내 주문 목록");

    // 상주: 주문 단건(본인) 조회
    r = await fetch(`${base}/api/orders/${orderId}`, { headers: { Cookie: fam2Cookie } });
    data = await r.json();
    assert.strictEqual(r.status, 200);
    assert.strictEqual(data.order.hall.hallNumber, "1호실");
    ok("상주 본인 주문 단건 조회(빈소 정보 포함)");

    // 비로그인 주문 단건 → 401
    r = await fetch(`${base}/api/orders/${orderId}`);
    assert.strictEqual(r.status, 401);
    ok("비로그인 주문 조회 401");

    // 관리자: 전체 주문
    r = await fetch(`${base}/api/orders/admin/all`, { headers: jsonHeaders() });
    data = await r.json();
    assert.ok(data.items.length === 1 && data.items[0].family && data.items[0].family.username === "sangju2");
    ok("관리자 전체 주문(상주 정보 포함)");

    // 관리자: 주문 상태 변경
    r = await fetch(`${base}/api/orders/${orderId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ status: "confirmed" }),
    });
    data = await r.json();
    assert.strictEqual(data.order.status, "confirmed");
    ok("관리자 주문 상태 변경 → confirmed");

    // 상주가 상품 생성 시도 → 403
    r = await fetch(`${base}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: fam2Cookie },
      body: JSON.stringify({ category: "x", name: "y", price: 1 }),
    });
    assert.strictEqual(r.status, 403);
    ok("상주 상품 생성 시도 403");

    console.log(`\n[SMOKE] 전체 통과: ${passed}개`);
  } finally {
    server.close();
    await disconnectDB();
    await mongod.stop();
  }
}

run().catch((err) => {
  console.error("\n[SMOKE] 실패:", err.message);
  console.error(err);
  process.exit(1);
});
