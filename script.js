"use strict";

const CONFIG = { officeCode: "C10", schoolCode: "7150109", timeout: 8000 };
const MEAL_OVERRIDE = { enabled: false, data: {} };
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
function weekStart(date) { return addDays(date, -((date.getUTCDay() + 6) % 7)); }
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
  return value && /^[123]$/.test(String(value.grade)) && /^[1-9]\d?$/.test(String(value.className));
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
  const start = kind === "timetable" ? weekStart(from) : monthStart(from);
  const end = kind === "timetable" ? addDays(start, 4) : monthEnd(from);
  const key = kind === "timetable" ? dateKey(start) : dateKey(start).slice(0, 6);
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
    schedule: ["SchoolSchedule", ["AA_FROM_YMD", "AA_TO_YMD"], "AA_YMD"],
    timetable: ["hisTimetable", ["TI_FROM_YMD", "TI_TO_YMD"], "ALL_TI_YMD"]
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
  const text = data.warning || "일부 자료만 확인했습니다. 표시되지 않은 일정이나 교시가 있을 수 있습니다.";
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
function classForm() {
  const { grade, className } = state.selection;
  return `<form id="classForm" class="class-form">
    <label for="grade">학년<select id="grade" name="grade">${[1, 2, 3].map(value =>
      `<option value="${value}"${String(value) === grade ? " selected" : ""}>${value}학년</option>`).join("")}</select></label>
    <label for="className">반<input id="className" name="className" type="number" inputmode="numeric" min="1" max="99" step="1" value="${className}" required></label>
    <button class="submit-button" type="submit">조회</button></form>
    <p class="hint">반 번호를 입력하세요. 선택값은 이 브라우저에만 저장됩니다.</p>
    ${state.storageWarning ? `<p class="message warning">${escapeHTML(state.storageWarning)}</p>` : ""}`;
}
function renderTimetable(date, data, selection) {
  const days = Array.from({ length: 5 }, (_, index) => dateKey(addDays(date, index)));
  const periods = [...new Set(data.rows.map(row => String(row.PERIO)))].sort((a, b) => Number(a) - Number(b));
  if (!periods.length) return `<p class="message">${data.complete ? "선택한 학급·기간에 등록된 시간표가 없습니다." : "시간표를 모두 확인하지 못했습니다."}</p>${metadata(data)}`;
  const rows = periods.map(period => `<tr><th scope="row">${escapeHTML(period)}교시</th>${days.map(day => {
    const subjects = [...new Set(data.rows.filter(row => row.ALL_TI_YMD === day && String(row.PERIO) === period).map(row => row.ITRT_CNTNT))];
    return `<td>${subjects.length ? subjects.map(subject => `<span>${escapeHTML(subject)}</span>`).join("") : data.complete ? "—" : "미확인"}</td>`;
  }).join("")}</tr>`).join("");
  return `<div class="table-scroll" role="region" aria-label="주간 시간표" tabindex="0"><table class="timetable">
    <caption>${selection.grade}학년 ${selection.className}반</caption>
    <thead><tr><th scope="col">교시</th>${days.map((day, index) => `<th scope="col">${["월", "화", "수", "목", "금"][index]}<br>${Number(day.slice(4, 6))}/${Number(day.slice(6))}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody></table></div><p class="hint">${data.complete ? "—: 제공된 자료에 수업 정보가 없는 칸입니다." : "미확인 교시와 표시되지 않은 교시가 있을 수 있습니다."} 선택과목·변경 수업은 학교 안내도 확인해주세요.</p>${metadata(data)}`;
}
function heading() {
  const date = state.date;
  const title = state.view === "meal" ? "🍚 급식" : state.view === "schedule" ? "📅 학사일정" : "📚 우리 반 시간표";
  const label = state.view === "meal" ? dateLabel(date) : state.view === "schedule" ?
    `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월` : `${dateLabel(date)} ~ ${dateLabel(addDays(date, 4))}`;
  const unit = state.view === "meal" ? "날" : state.view === "schedule" ? "달" : "주";
  const current = state.view === "meal" ? "오늘" : `이번 ${unit}`;
  return `<h2>${title}</h2><strong class="date-title">${label}</strong>${state.view === "timetable" ? classForm() : ""}
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
  contentBox.setAttribute("aria-busy", "true");
  contentBox.innerHTML = heading() + '<div id="viewResult"><p class="loading" role="status">정보를 불러오는 중...</p></div>';
  const deadline = setTimeout(() => controller.abort(), 25000);
  try {
    let data, html;
    if (view === "meal") {
      data = await mealData(date, controller.signal);
      html = renderMeal(date, data);
    } else if (view === "schedule") {
      data = await getData(view, monthStart(date), monthEnd(date), {}, controller.signal);
      html = renderSchedule(data);
    } else {
      data = await getData(view, date, addDays(date, 4), { GRADE: selection.grade, CLASS_NM: selection.className }, controller.signal);
      html = renderTimetable(date, data, selection);
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
  state.date = view === "schedule" ? monthStart(today()) : view === "timetable" ? weekStart(today()) : today();
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
      addDays(state.date, amount * (state.view === "timetable" ? 7 : 1));
  }
  render();
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