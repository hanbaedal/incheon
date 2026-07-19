"use strict";
/* 상주 전용 서비스 다국어 (홈페이지 site_lang 공유) */

(function () {
  const LANGS = ["ko", "zh", "en"];
  let LANG = "ko";
  try {
    const saved = localStorage.getItem("site_lang");
    if (saved && LANGS.indexOf(saved) !== -1) LANG = saved;
  } catch (e) {}

  const M = {
    "common.loading": { ko: "불러오는 중…", zh: "加载中…", en: "Loading…" },
    "common.error": { ko: "요청 처리 중 오류가 발생했습니다.", zh: "处理请求时发生错误。", en: "An error occurred while processing your request." },
    "common.cancel": { ko: "취소", zh: "取消", en: "Cancel" },
    "common.save": { ko: "저장", zh: "保存", en: "Save" },
    "common.close": { ko: "닫기", zh: "关闭", en: "Close" },
    "common.print": { ko: "인쇄", zh: "打印", en: "Print" },
    "common.download": { ko: "받기", zh: "下载", en: "Download" },
    "common.preparing": { ko: "준비중", zh: "准备中", en: "Pending" },
    "common.none": { ko: "등록된 항목이 없습니다.", zh: "暂无登记项目。", en: "No items registered." },
    "common.moreItems": { ko: "외 {n}건", zh: "等 {n} 项", en: " + {n} more" },
    "common.deceasedPrefix": { ko: "故 ", zh: "故 ", en: "Late " },
    "common.funeralPrefix": { ko: "발인 ", zh: "出殡 ", en: "Procession " },
    "common.enshrinePrefix": { ko: "입관/안치 ", zh: "入棺/安置 ", en: "Enshrinement " },
    "common.daySuffix": { ko: "일장", zh: "日场", en: "-day" },
    "common.won": { ko: "원", zh: "韩元", en: " KRW" },
    "common.delete": { ko: "삭제", zh: "删除", en: "Remove" },
    "common.addToCart": { ko: "담기", zh: "加入", en: "Add" },
    "common.settle": { ko: "정산", zh: "结算", en: "TBD" },
    "common.reserved": { ko: "예약됨", zh: "已预约", en: "Reserved" },
    "common.noImage": { ko: "이미지 없음", zh: "无图片", en: "No image" },
    "common.errorPrefix": { ko: "오류: ", zh: "错误：", en: "Error: " },

    "lang.label": { ko: "언어", zh: "语言", en: "Language" },
    "lang.ko": { ko: "한국어", zh: "한국어", en: "KOR" },
    "lang.zh": { ko: "中文", zh: "中文", en: "中文" },
    "lang.en": { ko: "ENG", zh: "ENG", en: "ENG" },

    "brand.title": { ko: "상주 전용 서비스", zh: "丧主专用服务", en: "Family Portal" },
    "brand.sub": { ko: "인천병원장례식장 (인천중앙병원장례식장)", zh: "仁川医院殡仪馆（仁川中央医院殡仪馆）", en: "Incheon Hospital Funeral Hall" },
    "nav.shop": { ko: "장례 예약", zh: "殡葬预约", en: "Reservations" },
    "nav.orders": { ko: "내 예약", zh: "我的预约", en: "My Orders" },
    "nav.homepage": { ko: "홈페이지", zh: "网站首页", en: "Website" },
    "nav.logout": { ko: "로그아웃", zh: "退出登录", en: "Log out" },
    "nav.whoSuffix": { ko: " 님", zh: " 先生/女士", en: "" },

    "status.pending": { ko: "접수", zh: "受理", en: "Received" },
    "status.confirmed": { ko: "확인", zh: "确认", en: "Confirmed" },
    "status.paid": { ko: "결제완료", zh: "付款完成", en: "Paid" },
    "status.canceled": { ko: "취소", zh: "取消", en: "Canceled" },

    "login.pageTitle": { ko: "로그인 | 근로복지공단 인천병원 장례식장", zh: "登录 | 仁川医院殡仪馆", en: "Login | Incheon Funeral Hall" },
    "login.title": { ko: "로그인", zh: "登录", en: "Login" },
    "login.sub": { ko: "상주(유족)·관리자 통합 로그인입니다.\n계정에 맞는 화면으로 자동 이동합니다.", zh: "丧主（家属）·管理员统一登录。\n将根据账号自动进入相应页面。", en: "Sign in for family members or administrators.\nYou will be redirected to the appropriate page." },
    "login.username": { ko: "아이디", zh: "用户名", en: "Username" },
    "login.password": { ko: "비밀번호", zh: "密码", en: "Password" },
    "login.submit": { ko: "로그인", zh: "登录", en: "Sign in" },
    "login.submitting": { ko: "로그인 중…", zh: "登录中…", en: "Signing in…" },
    "login.foot": { ko: "계정이 없으신가요? 장례식장 상담실(<b>032-524-4444</b>)로 문의해 주세요.", zh: "还没有账号？请联系殡仪馆咨询室（<b>032-524-4444</b>）。", en: "Need an account? Contact the funeral desk at <b>032-524-4444</b>." },
    "login.backHome": { ko: "← 홈페이지로 돌아가기", zh: "← 返回网站首页", en: "← Back to website" },
    "login.pwShow": { ko: "비밀번호 표시", zh: "显示密码", en: "Show password" },
    "login.pwHide": { ko: "비밀번호 숨김", zh: "隐藏密码", en: "Hide password" },

    "shop.pageTitle": { ko: "장례 예약 | 상주 전용 서비스", zh: "殡葬预约 | 丧主专用服务", en: "Reservations | Family Portal" },
    "shop.title": { ko: "장례 서비스 예약", zh: "殡葬服务预约", en: "Funeral Service Reservations" },
    "shop.lead": { ko: "빈소 선택부터 장례 물품·접객 음식·화환·영정·상복·운구까지 미리 예약하실 수 있습니다. 빈소를 선택하면 고인·발인 정보 입력 창이 열립니다. 식음료·공산품류는 소비 후 발인 전 수기 정산됩니다.", zh: "可从选择灵堂起预约殡葬用品、接待餐饮、花圈、遗像、丧服、运柩车辆等。选择灵堂后将打开逝者·出殡信息输入窗口。部分餐饮·日用品于使用后、出殡前人工结算。", en: "Reserve halls, funeral goods, catering, flowers, portraits, mourning attire, and hearses in advance. Selecting a hall opens the deceased and procession details form. Some beverages and consumables are settled manually before procession." },
    "shop.cartSummary": { ko: "예약 요약", zh: "预约摘要", en: "Summary" },
    "shop.cartEmpty": { ko: "담긴 항목이 없습니다.", zh: "暂无项目。", en: "Your list is empty." },
    "shop.cartEmptyHint": { ko: "장례 물품·서비스를 추가로 선택할 수 있습니다.", zh: "可继续选择殡葬物品·服务。", en: "You can add more funeral items and services." },
    "shop.submitOrder": { ko: "예약 제출", zh: "提交预约", en: "Submit reservation" },
    "shop.submitting": { ko: "예약 처리 중…", zh: "预约处理中…", en: "Submitting…" },
    "shop.addedToast": { ko: "예약 목록에 담았습니다.", zh: "已加入预约列表。", en: "Added to your list." },
    "shop.orderOkToast": { ko: "예약이 접수되었습니다.", zh: "预约已受理。", en: "Your reservation has been submitted." },
    "shop.memoPrompt": { ko: "요청 사항이 있으면 입력해 주세요. (선택)", zh: "如有特殊要求请输入。（可选）", en: "Enter any special requests (optional)." },
    "shop.infoGuide": { ko: "장례 안내", zh: "殡葬指南", en: "Funeral guide" },
    "shop.tabForms": { ko: "관련서식", zh: "相关表格", en: "Forms" },
    "shop.tabFacility": { ko: "장사시설안내", zh: "殡葬设施指南", en: "Facilities" },
    "shop.supply": { ko: "선결제 공급가액", zh: "预付供应价", en: "Prepaid subtotal" },
    "shop.vat": { ko: "선결제 부가세", zh: "预付增值税", en: "Prepaid VAT" },
    "shop.total": { ko: "선결제 합계", zh: "预付合计", en: "Prepaid total" },
    "shop.sumNote": { ko: "* 빈소 이용료는 예약 제출 시 주문에 포함됩니다.", zh: "* 灵堂使用费将在提交预约时计入订单。", en: "* Hall usage fee is included when you submit the reservation." },
    "shop.sumNotePostpaid": { ko: " 생수·음료수·주류 등 사후정산 품목은 발인 전 수기 정산됩니다.", zh: " 矿泉水·饮料·酒类等后结算项目于出殡前人工结算。", en: " Postpaid items such as water and beverages are settled manually before procession." },
    "shop.postpaidTag": { ko: "발인 전 수기 정산", zh: "出殡前人工结算", en: "Settled before procession" },
    "shop.postpaidShort": { ko: "발인 전 정산", zh: "出殡前结算", en: "Postpaid" },
    "shop.hallAssigned": { ko: "배정 완료", zh: "已分配", en: "Assigned" },
    "shop.hallFeeReserved": { ko: " · 이용료 예약됨", zh: " · 使用费已预约", en: " · Hall fee reserved" },
    "shop.hallPending": { ko: "승인 대기", zh: "等待批准", en: "Pending approval" },
    "shop.hallLabel": { ko: "빈소 · ", zh: "灵堂 · ", en: "Hall · " },

    "orders.pageTitle": { ko: "내 예약 | 상주 전용 서비스", zh: "我的预约 | 丧主专用服务", en: "My Orders | Family Portal" },
    "orders.title": { ko: "내 예약 내역", zh: "我的预约记录", en: "My reservations" },
    "orders.lead": { ko: "예약하신 내역과 처리 상태를 확인하실 수 있습니다. 사후정산 품목은 발인 전 관리자가 실사용 수량을 정산합니다.", zh: "可查看预约记录及处理状态。后结算项目由管理员于出殡前按实际使用量结算。", en: "View your reservations and status. Postpaid items are settled by staff before procession based on actual use." },
    "orders.loading": { ko: "주문 내역을 불러오는 중…", zh: "正在加载订单…", en: "Loading orders…" },
    "orders.empty": { ko: "예약 내역이 없습니다.", zh: "暂无预约记录。", en: "No reservations yet." },
    "orders.goShop": { ko: "장례 예약하기 →", zh: "前往殡葬预约 →", en: "Make a reservation →" },
    "orders.listHead": { ko: "건별 예약 내역", zh: "逐笔预约记录", en: "Reservation list" },
    "orders.colNumber": { ko: "주문번호", zh: "订单号", en: "Order No." },
    "orders.colItems": { ko: "주요 품목", zh: "主要项目", en: "Main items" },
    "orders.colTotal": { ko: "합계", zh: "合计", en: "Total" },
    "orders.colStatus": { ko: "상태", zh: "状态", en: "Status" },
    "orders.colDate": { ko: "주문일", zh: "订单日", en: "Date" },
    "orders.colDoc": { ko: "문서", zh: "文档", en: "Documents" },
    "orders.docOrder": { ko: "주문서", zh: "订单", en: "Order" },
    "orders.docAggLead": { ko: "발인 정산 · 취소 제외 {n}건 합계", zh: "出殡结算 · 不含取消 {n} 笔合计", en: "Settlement · {n} orders (excl. canceled)" },
    "orders.docAggOrder": { ko: "주문서 합계", zh: "订单合计", en: "Combined order" },
    "orders.docStatement": { ko: "거래명세서", zh: "交易明细", en: "Statement" },
    "orders.docTax": { ko: "세금계산서", zh: "税务发票", en: "Tax invoice" },
    "orders.okBox": { ko: "예약이 정상 접수되었습니다. (예약번호 {n})", zh: "预约已成功受理。（预约号 {n}）", en: "Reservation submitted. (No. {n})" },
    "orders.noAgg": { ko: "집계할 주문이 없습니다.", zh: "没有可汇总的订单。", en: "No orders to summarize." },
    "orders.docTitle": { ko: "문서", zh: "文档", en: "Document" },

    "doc.pageTitle": { ko: "문서 출력 | 근로복지공단 인천병원 장례식장", zh: "文档打印 | 仁川医院殡仪馆", en: "Print document | Incheon Funeral Hall" },
    "doc.back": { ko: "← 돌아가기", zh: "← 返回", en: "← Back" },
    "doc.loading": { ko: "문서를 불러오는 중…", zh: "正在加载文档…", en: "Loading document…" },
    "doc.noOrder": { ko: "주문 정보가 없습니다.", zh: "没有订单信息。", en: "No order information." },
    "doc.needLogin": { ko: "로그인이 필요합니다.", zh: "需要登录。", en: "Login required." },
    "doc.loadOrderFail": { ko: "주문을 불러올 수 없습니다.", zh: "无法加载订单。", en: "Could not load order." },
    "doc.loadSummaryFail": { ko: "집계를 불러올 수 없습니다.", zh: "无法加载汇总。", en: "Could not load summary." },

    "hall.redirectLink": { ko: "장례 예약으로 이동", zh: "前往殡葬预约", en: "Go to reservations" },

    "hall.selectTitle": { ko: "빈소선택", zh: "选择灵堂", en: "Select hall" },
    "hall.assignedTitle": { ko: "빈소선택 · 배정 완료", zh: "选择灵堂 · 已分配", en: "Hall · Assigned" },
    "hall.pendingTitle": { ko: "빈소선택 · 승인 대기", zh: "选择灵堂 · 等待批准", en: "Hall · Pending" },
    "hall.pickNotice": { ko: "빈소를 선택하면 필수 입력 창이 열립니다. 고인·발인 정보를 입력 후 신청해 주세요.", zh: "选择灵堂后将打开必填信息窗口。请输入逝者·出殡信息后提交申请。", en: "Select a hall to open the required information form." },
    "hall.pendingNotice": { ko: "신청하신 빈소는 관리자 승인 대기 중입니다. 빈소를 선택하면 필수 정보 입력 창이 열립니다.", zh: "您申请的灵堂正在等待管理员批准。选择灵堂可输入/修改必填信息。", en: "Your hall request is pending approval. Select a hall to edit required information." },
    "hall.lockedNotice": { ko: "장례 예약이 접수되어 발인 일자·시각은 변경할 수 없습니다.", zh: "已提交殡葬预约，出殡日期·时间不可更改。", en: "A reservation exists; procession date and time cannot be changed." },
    "hall.activeNotice": { ko: "빈소가 배정되었습니다. 다른 탭에서 장례 물품·서비스를 예약해 주세요.", zh: "灵堂已分配。请在其他标签页预约殡葬物品·服务。", en: "Your hall is assigned. Reserve items and services in other tabs." },
    "hall.editUsage": { ko: "이용 정보 수정", zh: "修改使用信息", en: "Edit details" },
    "hall.editPending": { ko: "신청 정보 입력", zh: "输入申请信息", en: "Enter application" },
    "hall.modalNew": { ko: "빈소 이용 정보 입력", zh: "输入灵堂使用信息", en: "Hall information" },
    "hall.modalPending": { ko: "신청 정보 입력", zh: "输入申请信息", en: "Application details" },
    "hall.modalUsage": { ko: "이용 정보 수정", zh: "修改使用信息", en: "Edit hall details" },
    "hall.modalSub": { ko: "{name} · 고인·발인 정보를 입력해 주세요", zh: "{name} · 请输入逝者·出殡信息", en: "{name} · Enter deceased and procession details" },
    "hall.apply": { ko: "빈소 이용 신청", zh: "提交灵堂申请", en: "Submit hall request" },
    "hall.requiredInfo": { ko: "필수 입력 정보", zh: "必填信息", en: "Required information" },
    "hall.noAvailable": { ko: "현재 신청 가능한 빈소가 없습니다.", zh: "当前没有可申请的空灵堂。", en: "No halls available to request." },
    "hall.selectFirst": { ko: "빈소를 선택해 주세요.", zh: "请选择灵堂。", en: "Please select a hall." },
    "hall.selectDays": { ko: "장례 기간(3·4·5일장)을 선택해 주세요.", zh: "请选择殡葬天数（3·4·5日场）。", en: "Please select funeral days (3/4/5-day)." },
    "hall.needDeceased": { ko: "고인명과 발인 일자를 입력해 주세요.", zh: "请输入逝者姓名和出殡日期。", en: "Please enter the deceased name and procession date." },
    "hall.reqOk": { ko: "빈소 이용 신청이 접수되었습니다.", zh: "灵堂使用申请已受理。", en: "Hall request submitted." },
    "hall.saveOk": { ko: "신청 정보가 저장되었습니다.", zh: "申请信息已保存。", en: "Application saved." },
    "hall.usageOk": { ko: "이용 정보가 저장되었습니다.", zh: "使用信息已保存。", en: "Details saved." },
    "hall.daysTitle": { ko: "장례 기간 선택 *", zh: "选择殡葬天数 *", en: "Funeral period *" },
    "hall.virtualHint": { ko: "무빈소는 별도 빈소 이용료가 없습니다. 상담 후 진행됩니다.", zh: "无灵堂方案不另收使用费，请咨询后办理。", en: "No-hall option has no separate hall fee. Please consult staff." },
    "hall.daysHint": { ko: "장례 기간(3·4·5일장)을 선택하면 이용료가 계산됩니다.", zh: "选择3·4·5日场后将计算使用费。", en: "Select 3/4/5-day period to calculate the fee." },
    "hall.priceDaily": { ko: "단가 (1일)", zh: "单价（1日）", en: "Daily rate" },
    "hall.pricePeriod": { ko: "기간", zh: "期间", en: "Period" },
    "hall.priceAmount": { ko: "금액", zh: "金额", en: "Amount" },
    "hall.scheduleLocked": { ko: "예약(주문) 접수 후 발인 일자·시각은 변경할 수 없습니다.", zh: "预约受理后出殡日期·时间不可更改。", en: "Procession date and time cannot be changed after a reservation is submitted." },
    "hall.roomSummary": { ko: "현재 빈소 <b>{used}/{cap}</b>실 이용 중", zh: "当前 <b>{used}/{cap}</b> 间灵堂使用中", en: "<b>{used}/{cap}</b> halls in use" },
    "hall.roomFree": { ko: " · <b>{n}</b>실 즉시 배정 가능", zh: " · <b>{n}</b> 间可立即分配", en: " · <b>{n}</b> available now" },
    "hall.feeLine": { ko: "{days}일장 · 단가 {price}", zh: "{days}日场 · 单价 {price}", en: "{days}-day · {price}/day" },
    "hall.perDay": { ko: "1일", zh: "1日", en: "1 day" },

    "form.deceased": { ko: "고인명 *", zh: "逝者姓名 *", en: "Deceased name *" },
    "form.chief": { ko: "상주 *", zh: "丧主 *", en: "Chief mourner *" },
    "form.relation": { ko: "고인과의 관계", zh: "与逝者关系", en: "Relationship" },
    "form.age": { ko: "향년", zh: "享年", en: "Age at passing" },
    "form.relationPh": { ko: "예: 장남", zh: "例：长子", en: "e.g. Eldest son" },
    "form.agePh": { ko: "예: 향년 84세", zh: "例：享年84岁", en: "e.g. Age 84" },
    "form.enshrine": { ko: "입관/안치 일자", zh: "入棺/安置日期", en: "Enshrinement date" },
    "form.burial": { ko: "장지", zh: "安葬地", en: "Burial site" },
    "form.funeralDate": { ko: "발인 일자 *", zh: "出殡日期 *", en: "Procession date *" },
    "form.funeralTime": { ko: "발인 시각", zh: "出殡时间", en: "Procession time" },

    "info.formsLead": { ko: "장례와 관련된 행정업무에 필요한 각종 서식을 다운로드하실 수 있습니다.", zh: "可下载殡葬相关行政业务所需的各种表格。", en: "Download forms required for funeral-related administrative procedures." },
    "info.formsCol": { ko: "서식명", zh: "表格名称", en: "Form" },
    "info.formsNote": { ko: "전체 목록은 <a href=\"/pages/info/forms.html\" target=\"_blank\" rel=\"noopener\">서식 자료실</a>에서도 확인할 수 있습니다.", zh: "完整列表也可在<a href=\"/pages/info/forms.html\" target=\"_blank\" rel=\"noopener\">表格资料室</a>查看。", en: "See the full list in the <a href=\"/pages/info/forms.html\" target=\"_blank\" rel=\"noopener\">forms library</a>." },
    "info.facilityLead": { ko: "화장·납골·장지 및 장례식장 부대시설 안내입니다.", zh: "火葬·纳骨·墓地及殡仪馆附属设施指南。", en: "Crematorium, columbarium, cemetery, and facility information." },
    "info.facilityNote": { ko: "상담: <b>032-524-4444</b> (24시간)", zh: "咨询：<b>032-524-4444</b>（24小时）", en: "Consultation: <b>032-524-4444</b> (24h)" },
    "info.facility.crematory.title": { ko: "화장장 안내", zh: "火葬场指南", en: "Crematorium" },
    "info.facility.crematory.desc": { ko: "인천가족공원(승화원) 및 e하늘 예약 안내", zh: "仁川家族公园（升华院）及e天堂预约指南", en: "Incheon Family Park and e-Haneul booking" },
    "info.facility.columbarium.title": { ko: "납골당 안내", zh: "纳骨堂指南", en: "Columbarium" },
    "info.facility.columbarium.desc": { ko: "봉안시설(납골당) 안치 안내", zh: "骨灰安置设施指南", en: "Urn interment facilities" },
    "info.facility.cemetery.title": { ko: "공원묘지 안내", zh: "公园墓地指南", en: "Cemetery" },
    "info.facility.cemetery.desc": { ko: "매장·자연장 장지 안내", zh: "土葬·自然葬墓地指南", en: "Burial and natural burial sites" },
    "info.facility.binso.title": { ko: "빈소·접객 안내", zh: "灵堂·接待指南", en: "Halls & reception" },
    "info.facility.binso.desc": { ko: "빈소 규격 및 접객 시설", zh: "灵堂规格及接待设施", en: "Hall sizes and reception areas" },
    "info.facility.annex.title": { ko: "장례 진행 시설", zh: "殡葬进行设施", en: "Ceremony facilities" },
    "info.facility.annex.desc": { ko: "안치실·염습실·발인 준비 공간", zh: "安置室·入殓室·出殡准备空间", en: "Enshrinement and preparation rooms" },
    "info.facility.parking.title": { ko: "주차 안내", zh: "停车指南", en: "Parking" },
    "info.facility.parking.desc": { ko: "조문객·유가족 주차 안내", zh: "吊唁者·家属停车指南", en: "Parking for visitors and families" },

    "cat.hall": { ko: "빈소선택", zh: "选择灵堂", en: "Hall" },
    "cat.coffin": { ko: "장례 물품 · 관·횡대", zh: "殡葬用品 · 棺·横木", en: "Goods · Coffin" },
    "cat.shroud": { ko: "장례 물품 · 수의", zh: "殡葬用品 · 寿衣", en: "Goods · Shroud" },
    "cat.etc": { ko: "장례 물품 · 부속물품", zh: "殡葬用品 · 附属物品", en: "Goods · Accessories" },
    "cat.food": { ko: "접객 음식", zh: "接待餐饮", en: "Catering" },
    "cat.flower": { ko: "근조 화환", zh: "挽联花圈", en: "Flowers" },
    "cat.photo": { ko: "영정 사진", zh: "遗像照片", en: "Portraits" },
    "cat.dress": { ko: "상복 대여", zh: "丧服租赁", en: "Mourning attire" },
    "cat.hearse": { ko: "운구·차량", zh: "运柩·车辆", en: "Hearse" },

    "foodSub.meal": { ko: "식사류", zh: "餐食类", en: "Meals" },
    "foodSub.anju": { ko: "안주류", zh: "下酒菜类", en: "Side dishes" },
    "foodSub.tteok": { ko: "떡류", zh: "糕类", en: "Rice cakes" },
    "foodSub.fruit": { ko: "과일류", zh: "水果类", en: "Fruit" },
    "foodSub.jesa": { ko: "제사상", zh: "祭礼桌", en: "Memorial table" },
    "foodSub.beverage": { ko: "식음료류", zh: "餐饮类", en: "Beverages" },
    "foodSub.consumables": { ko: "공산품류", zh: "日用品类", en: "Consumables" },
    "flowerSub.altar": { ko: "제단장식", zh: "祭坛装饰", en: "Altar" },
    "flowerSub.basket": { ko: "근조바구니", zh: "挽联花篮", en: "Basket" },
    "flowerSub.wreath": { ko: "조문용 조화", zh: "吊唁用花", en: "Wreaths" },
    "flowerSub.chrysanthemum": { ko: "헌화용 국화", zh: "献花用菊花", en: "Chrysanthemum" },
    "flowerSub.coffin": { ko: "관장식", zh: "棺装饰", en: "Coffin decor" },
    "flowerSub.vehicle": { ko: "차량장식", zh: "车辆装饰", en: "Vehicle decor" },
    "photoSub.portrait": { ko: "영정", zh: "遗像", en: "Portrait" },
    "photoSub.frame": { ko: "액자", zh: "相框", en: "Frame" },
    "photoSub.idphoto": { ko: "증명사진", zh: "证件照", en: "ID photo" },
    "photoSub.instant": { ko: "즉석사진", zh: "即时照片", en: "Instant photo" },
    "hearseSub.cadillac": { ko: "캐딜락", zh: "凯迪拉克", en: "Cadillac" },
    "hearseSub.limousine": { ko: "고급리무진", zh: "高级礼宾车", en: "Limousine" },

    "prod.noneCoffin": { ko: "등록된 관·횡대가 없습니다.", zh: "暂无登记的棺·横木。", en: "No coffins registered." },
    "prod.noneShroud": { ko: "등록된 수의가 없습니다.", zh: "暂无登记的寿衣。", en: "No shrouds registered." },
    "prod.noneAccessory": { ko: "등록된 부속물품이 없습니다.", zh: "暂无登记的附属物品。", en: "No accessories registered." },
    "prod.noneFood": { ko: "등록된 품목이 없습니다.", zh: "暂无登记项目。", en: "No items registered." },
    "prod.noneFlower": { ko: "등록된 품목이 없습니다.", zh: "暂无登记项目。", en: "No items registered." },
    "prod.nonePhoto": { ko: "등록된 품목이 없습니다.", zh: "暂无登记项目。", en: "No items registered." },
    "prod.noneDress": { ko: "등록된 품목이 없습니다.", zh: "暂无登记项目。", en: "No items registered." },
    "prod.noneHearse": { ko: "등록된 차량이 없습니다.", zh: "暂无登记车辆。", en: "No vehicles registered." },
    "prod.noneGeneric": { ko: "등록된 상품이 없습니다.", zh: "暂无登记商品。", en: "No products registered." },
    "prod.coffinHead": { ko: "관", zh: "棺", en: "Coffin" },
    "prod.hoengdaeHead": { ko: "횡대", zh: "横木", en: "Bier" },
    "prod.dressHead": { ko: "상복 대여", zh: "丧服租赁", en: "Mourning attire" },
    "prod.colItem": { ko: "품목", zh: "品目", en: "Item" },
    "prod.colSize": { ko: "치수", zh: "尺寸", en: "Size" },
    "prod.colQty": { ko: "수량", zh: "数量", en: "Qty" },
    "prod.colPrice": { ko: "가격", zh: "价格", en: "Price" },
    "prod.colVehicle": { ko: "차량", zh: "车辆", en: "Vehicle" },
    "prod.colSpec": { ko: "규격", zh: "规格", en: "Spec" },
    "prod.foodHead": { ko: "접객 음식 · ", zh: "接待餐饮 · ", en: "Catering · " },
    "prod.flowerHead": { ko: "근조 화환 · ", zh: "挽联花圈 · ", en: "Flowers · " },
    "prod.photoHead": { ko: "영정 사진 · ", zh: "遗像照片 · ", en: "Portraits · " },
    "prod.hearseHead": { ko: "운구·차량 · ", zh: "运柩·车辆 · ", en: "Hearse · " },
    "prod.coffinDim": { ko: "어깨 {shoulder} · 높이 {height} · 길이 {length}㎜", zh: "肩宽 {shoulder} · 高 {height} · 长 {length}㎜", en: "Shoulder {shoulder} · H {height} · L {length} mm" },
    "prod.hoengdaeDim": { ko: "세로 {v} · 가로 {h} · 두께 {t}㎜", zh: "纵 {v} · 横 {h} · 厚 {t}㎜", en: "V {v} · H {h} · T {t} mm" },
  };

  function mT(key, vars) {
    const entry = M[key];
    let s = entry ? (entry[LANG] != null ? entry[LANG] : entry.ko) : key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  }

  function mLang() { return LANG; }

  function mSetLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    try { localStorage.setItem("site_lang", lang); } catch (e) {}
    window.location.reload();
  }

  function mHtmlLang() {
    return LANG === "zh" ? "zh-CN" : LANG;
  }

  function mApplyI18n(root) {
    root = root || document;
    root.querySelectorAll("[data-mi18n]").forEach((el) => {
      const key = el.getAttribute("data-mi18n");
      const html = el.getAttribute("data-mi18n-html") === "1";
      if (html) el.innerHTML = mT(key);
      else el.textContent = mT(key);
    });
    root.querySelectorAll("[data-mi18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", mT(el.getAttribute("data-mi18n-placeholder")));
    });
    document.documentElement.lang = mHtmlLang();
  }

  function mRenderLangSwitch(host) {
    if (!host) return;
    const btns = LANGS.map((l) => {
      const active = l === LANG ? " is-active" : "";
      return `<button type="button" class="m-lang-btn${active}" data-lang="${l}">${mT("lang." + l)}</button>`;
    }).join("");
    host.innerHTML = `<span class="m-lang-switch" role="group" aria-label="${mT("lang.label")}">${btns}</span>`;
    host.querySelectorAll(".m-lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const l = btn.getAttribute("data-lang");
        if (l !== LANG) mSetLang(l);
      });
    });
  }

  function mMemberStatus(key) {
    return mT("status." + key) || key;
  }

  function mReserveCats() {
    return [
      { key: "hall", label: mT("cat.hall"), type: "hall" },
      { key: "coffin", label: mT("cat.coffin"), type: "product" },
      { key: "shroud", label: mT("cat.shroud"), type: "shroud" },
      { key: "etc", label: mT("cat.etc"), type: "accessory" },
      { key: "food", label: mT("cat.food"), type: "food" },
      { key: "flower", label: mT("cat.flower"), type: "flower" },
      { key: "photo", label: mT("cat.photo"), type: "photo" },
      { key: "dress", label: mT("cat.dress"), type: "dress" },
      { key: "hearse", label: mT("cat.hearse"), type: "hearse" },
    ];
  }

  function mDefaultFuneralDayOptions() {
    return [
      { days: 3, label: "3" + mT("common.daySuffix") },
      { days: 4, label: "4" + mT("common.daySuffix") },
      { days: 5, label: "5" + mT("common.daySuffix") },
    ];
  }

  function mSubCats(prefix, keys) {
    return keys.map((key) => ({ key, label: mT(prefix + "." + key) }));
  }

  function mFoodSubCats() { return mSubCats("foodSub", ["meal", "anju", "tteok", "fruit", "jesa", "beverage", "consumables"]); }
  function mFlowerSubCats() { return mSubCats("flowerSub", ["altar", "basket", "wreath", "chrysanthemum", "coffin", "vehicle"]); }
  function mPhotoSubCats() { return mSubCats("photoSub", ["portrait", "frame", "idphoto", "instant"]); }
  function mHearseSubCats() { return mSubCats("hearseSub", ["cadillac", "limousine"]); }

  function mFacilityItems() {
    return [
      { key: "crematory", href: "/pages/support/crematory.html" },
      { key: "columbarium", href: "/pages/support/columbarium.html" },
      { key: "cemetery", href: "/pages/support/cemetery.html" },
      { key: "binso", href: "/pages/guide/binso.html" },
      { key: "annex", href: "/pages/guide/annex.html" },
      { key: "parking", href: "/pages/hall/parking.html" },
    ].map((f) => ({
      title: mT("info.facility." + f.key + ".title"),
      desc: mT("info.facility." + f.key + ".desc"),
      href: f.href,
    }));
  }

  function mPageTitle(key) {
    document.title = mT(key);
  }

  window.mT = mT;
  window.mLang = mLang;
  window.mSetLang = mSetLang;
  window.mApplyI18n = mApplyI18n;
  window.mRenderLangSwitch = mRenderLangSwitch;
  window.mMemberStatus = mMemberStatus;
  window.mReserveCats = mReserveCats;
  window.mDefaultFuneralDayOptions = mDefaultFuneralDayOptions;
  window.mFoodSubCats = mFoodSubCats;
  window.mFlowerSubCats = mFlowerSubCats;
  window.mPhotoSubCats = mPhotoSubCats;
  window.mHearseSubCats = mHearseSubCats;
  window.mFacilityItems = mFacilityItems;
  window.mPageTitle = mPageTitle;
})();
