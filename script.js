"use strict";

const CONFIG = { officeCode: "C10", schoolCode: "7150109", timeout: 8000 };
const MEAL_OVERRIDE = { enabled: false, data: {} };
const TIMETABLE_SOURCE = { year: 2026, semester: 2, date: "2026.08.10." };
const THIRD_GRADE_TIMETABLE = [
  "D B F E A C 공강",
  "G E F A D C 공강",
  "B D E G 창체 창체 공강",
  "C G B D F A 공강",
  "B G F E C A 공강"
];
const TIMETABLES = {
  "1-1": [
    "체육 통과 영어 수학 인기 미술 미술",
    "통사 국어 통과 체육 과실 수학 영어",
    "통사 국어 국사 수학 공강 창체 창체",
    "국사 영어 통사 통과 국어 인기 진로",
    "영어 수학 국어 통사 국사 인기 통과"
  ],
  "1-2": [
    "통과 과실 국사 국어 통사 영어 체육",
    "미술 미술 진로 인기 국사 통과 수학",
    "국어 영어 수학 통사 공강 창체 창체",
    "인기 통과 통사 국사 영어 국어 수학",
    "인기 체육 수학 통과 국어 영어 통사"
  ],
  "1-3": [
    "영어 인기 통사 국어 국사 수학 통과",
    "국어 영어 미술 미술 체육 통과 인기",
    "통과 통사 체육 수학 공강 창체 창체",
    "수학 영어 과실 통사 국사 통과 국어",
    "국사 인기 국어 진로 통사 수학 영어"
  ],
  "1-4": [
    "영어 국어 음악 체육 통과 인기 국사",
    "수학 과실 인기 체육 통사 국어 통과",
    "통과 수학 통사 영어 공강 창체 창체",
    "통사 음악 영어 국어 진로 국사 수학",
    "통사 국어 통과 국사 영어 수학 인기"
  ],
  "1-5": [
    "국어 국사 통사 영어 진로 체육 통과",
    "통사 수학 영어 국사 음악 인기 과실",
    "수학 통과 인기 국어 공강 창체 창체",
    "영어 인기 체육 국어 수학 통과 통사",
    "통사 국어 영어 수학 통과 음악 국사"
  ],
  "1-6": [
    "국어 수학 체육 인기 국사 통과 영어",
    "인기 국사 수학 통과 국어 진로 통사",
    "인기 통사 영어 음악 공강 창체 창체",
    "통과 통사 수학 국어 음악 영어 과실",
    "통사 통과 영어 국어 국사 체육 수학"
  ],
  "2-1": [
    "A 미창 미창 B 미적 D 국사",
    "화언 C 스생 D 미적 A 영Ⅱ",
    "화언 미적 B 영Ⅱ 공강 창체 창체",
    "A 화언 미적 영Ⅱ C D 국사",
    "국사 화언 영Ⅱ C 공강 B 스생"
  ],
  "2-2": [
    "공강 스생 국사 B 영Ⅱ D 화언",
    "미적 C 영Ⅱ D 화언 공강 국사",
    "미창 미창 B 미적 공강 창체 창체",
    "공강 국사 화언 영Ⅱ C D 미적",
    "화언 미적 스생 C 공강 B 영Ⅱ"
  ],
  "2-3": [
    "A 영Ⅱ 미적 B 화언 D 스생",
    "국사 C 화언 D 영Ⅱ A 미적",
    "미적 화언 B 스생 공강 창체 창체",
    "A 국사 미창 미창 C D 영Ⅱ",
    "미적 국사 화언 C 공강 B 영Ⅱ"
  ],
  "2-4": [
    "A 미적 화언 B 영Ⅱ D 국사",
    "영Ⅱ C 미적 D 화언 A 국사",
    "스생 영Ⅱ B 화언 공강 창체 창체",
    "A 미적 영Ⅱ 화언 C D 국사",
    "스생 미창 미창 C 공강 B 미적"
  ],
  "2-5": [
    "A 국사 영Ⅱ B 스생 D 미적",
    "미적 C 화언 D 국사 A 영Ⅱ",
    "국사 영Ⅱ B 화언 공강 창체 창체",
    "A 화언 음연 미적 C D 스생",
    "미적 음연 영Ⅱ C 공강 B 화언"
  ],
  "2-6": [
    "A 화언 영Ⅱ B 미적 공강 음연",
    "스생 C 국사 공강 미적 A 화언",
    "미적 음연 B 영Ⅱ 공강 창체 창체",
    "A 영Ⅱ 국사 스생 C 공강 화언",
    "화언 영Ⅱ 국사 C 공강 B 미적"
  ],
  "2-7": [
    "A 화언 미적 B 음연 D 영Ⅱ",
    "화언 C 미적 D 국사 A 스생",
    "영Ⅱ 국사 B 미적 공강 창체 창체",
    "A 스생 화언 국사 C D 영Ⅱ",
    "영Ⅱ 미적 음연 C 공강 B 화언"
  ],
  "3-1": THIRD_GRADE_TIMETABLE,
  "3-2": THIRD_GRADE_TIMETABLE,
  "3-3": THIRD_GRADE_TIMETABLE,
  "3-4": THIRD_GRADE_TIMETABLE,
  "3-5": THIRD_GRADE_TIMETABLE,
  "3-6": THIRD_GRADE_TIMETABLE,
  "3-7": THIRD_GRADE_TIMETABLE,
};

const STORAGE_KEY = "busanjin-school.class.v1";
const contentBox = document.getElementById("contentBox");
const state = {
  view: "", date: today(), selection: readSelection(), request: 0,
  controller: null, storageWarning: ""
};

function today() {
  return new Date(new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) + "T00:00:00Z");
}
function dateKey(date) { return date.toISOString().slice(0, 10).replaceAll("-", ""); }
function addDays(date, amount) { return new Date(date.getTime() + amount * 86400000); }
function monthStart(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)); }
function monthEnd(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)); }
function dateLabel(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "UTC", year: "numeric", month: "long", day: "numeric", weekday: "short"
  }).format(date);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function menuHTML(value) {
  return String(value ?? "").split(/<br\s*\/?>|\r?\n/i).map(escapeHTML).join("<br>");
}
function validSelection(value) {
  return Boolean(value && Object.hasOwn(TIMETABLES, `${value.grade}-${value.className}`));
}
function readSelection() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (validSelection(value)) return { grade: String(value.grade), className: String(value.className) };
  } catch {}
  return { grade: "1", className: "1" };
}
function saveSelection(value) {
  state.selection = value;
  state.storageWarning = "";
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
  catch { state.storageWarning = "이 브라우저에서는 선택한 학년·반을 저장할 수 없습니다. 현재 조회는 가능합니다."; }
}

async function fetchJSON(url, signal, optional = false) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, CONFIG.timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (optional && response.status === 404) return null;
    if (!response.ok) throw new Error("서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
async function neisPage(service, filters, signal) {
  const params = new URLSearchParams({
    Type: "json", pIndex: "1", pSize: "5",
    ATPT_OFCDC_SC_CODE: CONFIG.officeCode, SD_SCHUL_CODE: CONFIG.schoolCode, ...filters
  });
  const data = await fetchJSON(`https://open.neis.go.kr/hub/${service}?${params}`, signal);
  if (data.RESULT?.CODE === "INFO-200") return { rows: [], complete: true };
  const block = data[service];
  const head = block?.find(part => part.head)?.head;
  const result = data.RESULT || head?.find(part => part.RESULT)?.RESULT;
  if (result?.CODE !== "INFO-000") throw new Error("자료를 정상적으로 조회하지 못했습니다. 잠시 후 다시 시도해주세요.");
  const rows = block?.find(part => part.row)?.row;
  const total = Number(head?.find(part => "list_total_count" in part)?.list_total_count);
  if (!Array.isArray(rows) || !Number.isInteger(total) || total < rows.length) {
    throw new Error("받은 자료를 확인할 수 없습니다. 다시 조회해주세요.");
  }
  return { rows, complete: rows.length === total };
}
async function rangeData(service, fields, from, to, filters, signal, depth = 0) {
  const data = await neisPage(service, {
    ...filters, [fields[0]]: dateKey(from), [fields[1]]: dateKey(to)
  }, signal);
  if (data.complete || dateKey(from) === dateKey(to)) return data;
  // 인증키 없는 응답은 날짜 범위를 나누어 확인하되, 하루 안의 누락도 검사합니다.
  const middle = addDays(from, Math.floor((to - from) / 86400000 / 2));
  const left = () => rangeData(service, fields, from, middle, filters, signal, depth + 1);
  const right = () => rangeData(service, fields, addDays(middle, 1), to, filters, signal, depth + 1);
  const parts = depth < 2 ? await Promise.all([left(), right()]) : [await left(), await right()];
  return { rows: parts.flatMap(part => part.rows), complete: parts.every(part => part.complete) };
}
async function snapshot(kind, from, to, signal) {
  const start = monthStart(from);
  const end = monthEnd(from);
  const key = dateKey(start).slice(0, 6);
  try {
    const data = await fetchJSON(new URL(`data/${kind}/${key}.json`, document.baseURI), signal, true);
    const age = Date.now() - Date.parse(data?.generatedAt);
    if (data?.version !== 1 || data.schoolCode !== CONFIG.schoolCode || data.kind !== kind ||
        data.complete !== true || data.from !== dateKey(start) || data.to !== dateKey(end) ||
        !Array.isArray(data.rows) || !Number.isFinite(age) || age < -300000 || age > 36 * 3600000) return null;
    return data;
  } catch (error) {
    if (signal.aborted) throw error;
    return null;
  }
}
async function getData(kind, from, to, filters, signal) {
  const definitions = {
    meal: ["mealServiceDietInfo", ["MLSV_FROM_YMD", "MLSV_TO_YMD"], "MLSV_YMD"],
    schedule: ["SchoolSchedule", ["AA_FROM_YMD", "AA_TO_YMD"], "AA_YMD"]
  };
  const [service, fields, dateField] = definitions[kind];
  const cached = await snapshot(kind, from, to, signal);
  const data = cached || await rangeData(service, fields, from, to, filters, signal);
  const rows = data.rows.filter(row => row[dateField] >= dateKey(from) && row[dateField] <= dateKey(to) &&
    Object.entries(filters).every(([key, value]) => String(row[key]) === value));
  return { ...data, rows: [...new Map(rows.map(row => [JSON.stringify(row), row])).values()] };
}
function metadata(data) {
  const warning = data.warning || !data.complete;
  const text = data.warning || "일부 자료만 확인했습니다. 표시되지 않은 급식이나 일정이 있을 수 있습니다.";
  return (warning ? `<p class="message warning" role="status">${escapeHTML(text)}</p>` : "") +
    `<p class="source">나이스 공개자료 기준${data.generatedAt ? ` · 자료 갱신: ${escapeHTML(new Date(data.generatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }))}` : ""}</p>`;
}
function overrideFor(date, type) {
  if (!MEAL_OVERRIDE.enabled) return null;
  const day = MEAL_OVERRIDE.data[dateKey(date)];
  const value = Array.isArray(day) ? (type === "lunch" ? day : null) : day?.[type];
  if (Array.isArray(value)) return { menu: value, calories: "" };
  return value && Array.isArray(value.menu) ? value : null;
}
async function mealData(date, signal) {
  const count = ["lunch", "dinner"].filter(type => overrideFor(date, type)).length;
  if (count === 2) return { rows: [], complete: true, manualOnly: true };
  try { return await getData("meal", date, date, {}, signal); }
  catch (error) {
    if (signal.aborted || !count) throw error;
    return { rows: [], complete: false, warning: "자동 급식 정보를 불러오지 못해 확인된 긴급 수정 정보만 표시합니다." };
  }
}
function renderMeal(date, data) {
  const cards = [["lunch", "2", "중식"], ["dinner", "3", "석식"]].map(([type, code, name]) => {
    const manual = overrideFor(date, type);
    const meals = data.rows.filter(row => String(row.MMEAL_SC_CODE) === code || row.MMEAL_SC_NM === name);
    let body;
    if (manual) {
      body = manual.menu.length ? manual.menu.map(escapeHTML).join("<br>") : "등록된 급식이 없습니다.";
      if (manual.calories) body += `<p class="calories">열량: ${escapeHTML(manual.calories)}</p>`;
      body += '<p class="hint">학교 사정에 따라 수정된 급식 정보입니다.</p>';
    } else {
      body = meals.map(meal => menuHTML(meal.DDISH_NM) +
        (meal.CAL_INFO ? `<p class="calories">열량: ${escapeHTML(meal.CAL_INFO)}</p>` : "")).join("<br>") ||
        (data.complete ? `등록된 ${name} 정보가 없습니다.` : `${name} 정보를 확인하지 못했습니다.`);
    }
    return `<section class="meal-card"><h3>${name}</h3><div>${body}</div></section>`;
  }).join("");
  return `<div class="meal-grid">${cards}</div>` +
    (data.manualOnly ? '<p class="source">학생회 정보부 긴급 수정 정보</p>' : metadata(data));
}
function renderSchedule(data) {
  const rows = data.rows.filter(row => String(row.EVENT_NM).replace(/\s/g, "") !== "토요휴업일")
    .sort((a, b) => a.AA_YMD.localeCompare(b.AA_YMD));
  const body = rows.map(row => {
    const key = row.AA_YMD;
    const date = new Date(`${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}T00:00:00Z`);
    return `<article class="schedule-item"><strong>${dateLabel(date)}</strong><p>${escapeHTML(row.EVENT_NM)}</p></article>`;
  }).join("");
  return (body || `<p class="message">${data.complete ? "토요휴업일을 제외한 등록 일정이 없습니다." : "확인된 일정이 없습니다. 전체 조회는 완료되지 않았습니다."}</p>`) + metadata(data);
}
function classNames(grade) {
  return Object.keys(TIMETABLES).filter(key => key.startsWith(`${grade}-`)).map(key => key.split("-")[1]);
}
function classOptions(grade, selected) {
  return classNames(grade).map(value => `<option value="${value}"${value === selected ? " selected" : ""}>${value}반</option>`).join("");
}
function classForm() {
  const { grade, className } = state.selection;
  return `<form id="classForm" class="class-form">
    <label for="grade">학년<select id="grade" name="grade">${[1, 2, 3].map(value =>
      `<option value="${value}"${String(value) === grade ? " selected" : ""}>${value}학년</option>`).join("")}</select></label>
    <label for="className">반<select id="className" name="className">${classOptions(grade, className)}</select></label>
    <button class="submit-button" type="submit">조회</button></form>
    <p class="hint">선택한 학년·반은 조회 버튼을 누르면 이 브라우저에 저장됩니다.</p>
    ${state.storageWarning ? `<p class="message warning">${escapeHTML(state.storageWarning)}</p>` : ""}`;
}
function renderTimetable(selection) {
  if (!validSelection(selection)) return '<p class="message">선택한 학급의 시간표가 없습니다.</p>';
  const days = TIMETABLES[`${selection.grade}-${selection.className}`].map(day => day.split(" "));
  const rows = Array.from({ length: 7 }, (_, period) => `<tr><th scope="row">${period + 1}교시</th>${days.map(day => {
    const subject = day[period];
    return `<td${/^[A-Z]+$/.test(subject) ? ' class="elective"' : ""}>${escapeHTML(subject)}</td>`;
  }).join("")}</tr>`).join("");
  return `<p class="message">A·B·C·D·E·F·G는 선택과목 구분입니다. 실제 수강 과목은 개인별 선택 내역을 확인해주세요.</p>
    <div class="table-scroll" role="region" aria-label="2학기 기본 시간표" tabindex="0"><table class="timetable">
    <caption>${selection.grade}학년 ${selection.className}반 · ${TIMETABLE_SOURCE.year}학년도 ${TIMETABLE_SOURCE.semester}학기</caption>
    <thead><tr><th scope="col">교시</th>${["월", "화", "수", "목", "금"].map(day => `<th scope="col">${day}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="hint">과목 약어와 영어가 붙지 않은 공강·창체 표시는 PDF 원문 기준입니다.</p>
    <p class="source">${TIMETABLE_SOURCE.date} 학생 안내용 시간표(안) 기준입니다. 휴일·시험·임시 시간표 변경은 반영되지 않습니다.</p>`;
}
function heading() {
  if (state.view === "timetable") return `<h2>📚 우리 반 시간표</h2><strong class="date-title">${TIMETABLE_SOURCE.year}학년도 ${TIMETABLE_SOURCE.semester}학기 기본 시간표</strong>${classForm()}`;
  const date = state.date;
  const title = state.view === "meal" ? "🍚 급식" : "📅 학사일정";
  const label = state.view === "meal" ? dateLabel(date) : `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월`;
  const unit = state.view === "meal" ? "날" : "달";
  const current = state.view === "meal" ? "오늘" : "이번 달";
  return `<h2>${title}</h2><strong class="date-title">${label}</strong>
    <div class="controls"><button type="button" data-action="previous">← 이전 ${unit}</button>
    <button type="button" data-action="current">${current}</button><button type="button" data-action="next">다음 ${unit} →</button></div>`;
}
async function render() {
  state.controller?.abort();
  const id = ++state.request;
  const controller = new AbortController();
  state.controller = controller;
  const { view, date } = state;
  const selection = { ...state.selection };
  contentBox.hidden = false;
  if (view === "notice") {
    contentBox.setAttribute("aria-busy", "false");
    contentBox.innerHTML = "<h2>📢 학생회 공지</h2><p>현재 등록된 학생회 공지가 없습니다.</p>";
    return;
  }
  if (view === "timetable") {
    contentBox.setAttribute("aria-busy", "false");
    contentBox.innerHTML = heading() + renderTimetable(selection);
    return;
  }
  contentBox.setAttribute("aria-busy", "true");
  contentBox.innerHTML = heading() + '<div id="viewResult"><p class="loading" role="status">정보를 불러오는 중...</p></div>';
  const deadline = setTimeout(() => controller.abort(), 25000);
  try {
    let data, html;
    if (view === "meal") {
      data = await mealData(date, controller.signal);
      html = renderMeal(date, data);
    } else {
      data = await getData(view, monthStart(date), monthEnd(date), {}, controller.signal);
      html = renderSchedule(data);
    }
    if (id === state.request) document.getElementById("viewResult").innerHTML = html;
  } catch (error) {
    if (id !== state.request) return;
    const message = error.name === "AbortError" ? "응답이 늦어 조회를 중단했습니다. 다시 시도해주세요." : "정보를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.";
    document.getElementById("viewResult").innerHTML = `<p class="message error" role="alert">${escapeHTML(message)}</p><button class="retry-button" type="button" data-action="retry">다시 시도</button>`;
  } finally {
    clearTimeout(deadline);
    if (id === state.request) contentBox.setAttribute("aria-busy", "false");
  }
}
function selectView(view) {
  state.view = view;
  state.date = view === "schedule" ? monthStart(today()) : today();
  document.querySelectorAll("[data-view]").forEach(button => {
    if (button.dataset.view === view) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  render();
  contentBox.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.view) return selectView(button.dataset.view);
  if (button.dataset.placeholder) return alert(`${button.dataset.placeholder} 링크가 아직 등록되지 않았습니다.`);
  const action = button.dataset.action;
  if (!action) return;
  if (action === "current") return selectView(state.view);
  if (action !== "retry") {
    const amount = action === "previous" ? -1 : 1;
    state.date = state.view === "schedule" ? new Date(Date.UTC(state.date.getUTCFullYear(), state.date.getUTCMonth() + amount, 1)) :
      addDays(state.date, amount);
  }
  render();
});
document.addEventListener("change", event => {
  if (event.target.id !== "grade") return;
  const select = document.getElementById("className");
  const names = classNames(event.target.value);
  select.innerHTML = classOptions(event.target.value, names.includes(select.value) ? select.value : names[0]);
});
document.addEventListener("submit", event => {
  if (event.target.id !== "classForm") return;
  event.preventDefault();
  const form = new FormData(event.target);
  const value = { grade: String(form.get("grade")), className: String(form.get("className")).trim() };
  if (!validSelection(value)) return;
  saveSelection(value);
  render();
});