/* =============================================
   LIFE DASHBOARD — app.js
   ============================================= */

"use strict";

/* ─────────────────────────────────────────────
   CONSTANTS & STATE
───────────────────────────────────────────── */
const STORAGE_KEYS = {
  THEME:    "ld_theme",
  NAME:     "ld_name",
  POMODORO: "ld_pomodoro",
  TODOS:    "ld_todos",
  LINKS:    "ld_links",
};

const state = {
  theme:       localStorage.getItem(STORAGE_KEYS.THEME)    || "dark",
  name:        localStorage.getItem(STORAGE_KEYS.NAME)     || "",
  pomodoro:    parseInt(localStorage.getItem(STORAGE_KEYS.POMODORO)) || 25,
  todos:       JSON.parse(localStorage.getItem(STORAGE_KEYS.TODOS))  || [],
  links:       JSON.parse(localStorage.getItem(STORAGE_KEYS.LINKS))  || [],

  // timer runtime
  timerRunning:  false,
  timerSeconds:  0,
  timerInterval: null,
};

/* ─────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────── */
function save(key, value) {
  localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function getFaviconEmoji(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    // Common site emoji mapping
    const map = {
      "youtube.com": "▶️", "youtu.be": "▶️",
      "github.com": "🐙",
      "google.com": "🔍",
      "twitter.com": "🐦", "x.com": "🐦",
      "instagram.com": "📸",
      "linkedin.com": "💼",
      "reddit.com": "🤖",
      "notion.so": "📝",
      "figma.com": "🎨",
      "stackoverflow.com": "📚",
      "netflix.com": "🎬",
      "spotify.com": "🎵",
      "discord.com": "💬",
      "whatsapp.com": "💬",
      "facebook.com": "📘",
      "wikipedia.org": "📖",
      "amazon.com": "📦",
      "medium.com": "✍️",
      "dev.to": "💻",
      "codepen.io": "🖊️",
    };
    for (const [domain, emoji] of Object.entries(map)) {
      if (host.includes(domain)) return emoji;
    }
  } catch (_) {}
  return "🔗";
}

/* ─────────────────────────────────────────────
   GREETING & DATETIME
───────────────────────────────────────────── */
function updateGreeting() {
  const now  = new Date();
  const hour = now.getHours();

  let part;
  if (hour < 12)       part = "Good morning";
  else if (hour < 17)  part = "Good afternoon";
  else if (hour < 21)  part = "Good evening";
  else                 part = "Good night";

  const name = state.name ? `, <span>${state.name}</span>` : "";
  document.getElementById("greeting").innerHTML = `${part}${name} 👋`;
}

function updateDatetime() {
  const now = new Date();
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const dateStr = now.toLocaleDateString(undefined, opts);
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  document.getElementById("datetime").textContent = `${dateStr} • ${timeStr}`;
}

/* ─────────────────────────────────────────────
   THEME
───────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-toggle").textContent = theme === "dark" ? "🌙" : "☀️";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save(STORAGE_KEYS.THEME, state.theme);
  applyTheme(state.theme);
}

/* ─────────────────────────────────────────────
   SETTINGS MODAL
───────────────────────────────────────────── */
function openSettings() {
  document.getElementById("custom-name").value    = state.name;
  document.getElementById("pomodoro-time").value  = state.pomodoro;
  document.getElementById("settings-modal").classList.remove("hidden");
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("custom-name").focus();
}

function closeSettings() {
  document.getElementById("settings-modal").classList.add("hidden");
  document.getElementById("modal-overlay").classList.add("hidden");
}

function saveSettings() {
  const newName  = document.getElementById("custom-name").value.trim();
  const newTime  = parseInt(document.getElementById("pomodoro-time").value);

  if (!isNaN(newTime) && newTime >= 1 && newTime <= 60) {
    state.pomodoro = newTime;
    save(STORAGE_KEYS.POMODORO, String(newTime));
  }

  state.name = newName;
  save(STORAGE_KEYS.NAME, newName);

  // Reset timer if not running so it reflects new duration
  if (!state.timerRunning) {
    state.timerSeconds = state.pomodoro * 60;
    renderTimer();
  }

  updateGreeting();
  closeSettings();
}

/* ─────────────────────────────────────────────
   FOCUS TIMER
───────────────────────────────────────────── */
function initTimer() {
  state.timerSeconds = state.pomodoro * 60;
  renderTimer();
}

function renderTimer() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  const display = document.getElementById("timer-display");
  display.textContent = `${pad(mins)}:${pad(secs)}`;

  display.classList.remove("running", "done");
  if (state.timerRunning) display.classList.add("running");
  if (state.timerSeconds === 0) display.classList.add("done");
}

function startTimer() {
  if (state.timerRunning || state.timerSeconds === 0) return;
  state.timerRunning = true;
  renderTimer();

  state.timerInterval = setInterval(() => {
    state.timerSeconds--;
    renderTimer();

    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      renderTimer();
      document.getElementById("timer-label").textContent = "Session Complete! 🎉";
      // Browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("Focus session complete! Time for a break. 🎉");
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  renderTimer();
  document.getElementById("timer-label").textContent = "Paused";
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerSeconds = state.pomodoro * 60;
  renderTimer();
  document.getElementById("timer-label").textContent = "Focus Session";
}

/* ─────────────────────────────────────────────
   TO-DO LIST
───────────────────────────────────────────── */
function renderTodos() {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  state.todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");
    li.dataset.index = index;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.done ? "checked" : ""} data-index="${index}" aria-label="Mark done" />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="todo-btn edit" data-index="${index}" title="Edit task">✏️</button>
        <button class="todo-btn delete" data-index="${index}" title="Delete task">🗑️</button>
      </div>
    `;

    list.appendChild(li);
  });

  // Badge: total count
  document.getElementById("todo-count").textContent = state.todos.length;

  // Remaining count
  const remaining = state.todos.filter(t => !t.done).length;
  document.getElementById("todo-remaining").textContent =
    state.todos.length === 0
      ? "No tasks yet"
      : `${remaining} remaining`;
}

function addTodo() {
  const input = document.getElementById("todo-input");
  const text = input.value.trim();
  if (!text) return;

  state.todos.push({ text, done: false });
  save(STORAGE_KEYS.TODOS, state.todos);
  renderTodos();
  input.value = "";
  input.focus();
}

function toggleTodo(index) {
  state.todos[index].done = !state.todos[index].done;
  save(STORAGE_KEYS.TODOS, state.todos);
  renderTodos();
}

function deleteTodo(index) {
  state.todos.splice(index, 1);
  save(STORAGE_KEYS.TODOS, state.todos);
  renderTodos();
}

function clearDoneTodos() {
  state.todos = state.todos.filter(t => !t.done);
  save(STORAGE_KEYS.TODOS, state.todos);
  renderTodos();
}

/* ── Edit task ── */
let editingIndex = null;

function openEditModal(index) {
  editingIndex = index;
  document.getElementById("edit-input").value = state.todos[index].text;
  document.getElementById("edit-modal").classList.remove("hidden");
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("edit-input").focus();
}

function closeEditModal() {
  editingIndex = null;
  document.getElementById("edit-modal").classList.add("hidden");
  document.getElementById("modal-overlay").classList.add("hidden");
}

function saveEdit() {
  if (editingIndex === null) return;
  const newText = document.getElementById("edit-input").value.trim();
  if (!newText) return;
  state.todos[editingIndex].text = newText;
  save(STORAGE_KEYS.TODOS, state.todos);
  renderTodos();
  closeEditModal();
}

/* ─────────────────────────────────────────────
   QUICK LINKS
───────────────────────────────────────────── */
function renderLinks() {
  const grid = document.getElementById("links-grid");
  grid.innerHTML = "";

  state.links.forEach((link, index) => {
    const btn = document.createElement("a");
    btn.className = "link-btn";
    btn.href = link.url;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";

    const emoji = getFaviconEmoji(link.url);

    btn.innerHTML = `
      <span class="link-favicon">${emoji}</span>
      <span>${escapeHtml(link.name)}</span>
      <button class="link-delete" data-index="${index}" title="Remove link" aria-label="Remove link">✕</button>
    `;

    grid.appendChild(btn);
  });
}

function addLink() {
  const nameInput = document.getElementById("link-name-input");
  const urlInput  = document.getElementById("link-url-input");

  const name = nameInput.value.trim();
  let url     = urlInput.value.trim();

  if (!name || !url) return;

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  state.links.push({ name, url });
  save(STORAGE_KEYS.LINKS, state.links);
  renderLinks();
  nameInput.value = "";
  urlInput.value  = "";
  nameInput.focus();
}

function deleteLink(index) {
  state.links.splice(index, 1);
  save(STORAGE_KEYS.LINKS, state.links);
  renderLinks();
}

/* ─────────────────────────────────────────────
   XSS PROTECTION
───────────────────────────────────────────── */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ─────────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────────── */
function bindEvents() {
  // Theme toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // Settings
  document.getElementById("open-settings").addEventListener("click", openSettings);
  document.getElementById("save-settings").addEventListener("click", saveSettings);
  document.getElementById("close-settings").addEventListener("click", closeSettings);

  // Close modals on overlay click
  document.getElementById("modal-overlay").addEventListener("click", () => {
    closeSettings();
    closeEditModal();
  });

  // Timer
  document.getElementById("timer-start").addEventListener("click", startTimer);
  document.getElementById("timer-stop").addEventListener("click", stopTimer);
  document.getElementById("timer-reset").addEventListener("click", resetTimer);

  // To-do: add on button click
  document.getElementById("todo-add").addEventListener("click", addTodo);

  // To-do: add on Enter key
  document.getElementById("todo-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTodo();
  });

  // To-do: delegation for check, edit, delete
  document.getElementById("todo-list").addEventListener("click", (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;
    const i = parseInt(index);

    if (e.target.classList.contains("todo-checkbox")) toggleTodo(i);
    if (e.target.classList.contains("edit"))           openEditModal(i);
    if (e.target.classList.contains("delete"))         deleteTodo(i);
  });

  // To-do: edit modal
  document.getElementById("save-edit").addEventListener("click", saveEdit);
  document.getElementById("cancel-edit").addEventListener("click", closeEditModal);
  document.getElementById("edit-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") closeEditModal();
  });

  // To-do: clear done
  document.getElementById("todo-clear-done").addEventListener("click", clearDoneTodos);

  // Quick links: add on button click
  document.getElementById("link-add").addEventListener("click", addLink);

  // Quick links: add on Enter key in URL input
  document.getElementById("link-url-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addLink();
  });

  // Quick links: delegation for delete button
  document.getElementById("links-grid").addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".link-delete");
    if (deleteBtn) {
      e.preventDefault(); // prevent the <a> tag from firing
      const i = parseInt(deleteBtn.dataset.index);
      deleteLink(i);
    }
  });

  // Settings: Enter key
  document.getElementById("pomodoro-time").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveSettings();
    if (e.key === "Escape") closeSettings();
  });
  document.getElementById("custom-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveSettings();
    if (e.key === "Escape") closeSettings();
  });

  // Close edit modal on Escape key anywhere
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSettings();
      closeEditModal();
    }
  });
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
function init() {
  // Apply saved theme
  applyTheme(state.theme);

  // Greeting & datetime (update every second)
  updateGreeting();
  updateDatetime();
  setInterval(() => {
    updateDatetime();
    updateGreeting(); // re-check in case hour changes
  }, 1000);

  // Timer
  initTimer();

  // Todos
  renderTodos();

  // Links
  renderLinks();

  // Events
  bindEvents();

  // Request notification permission for timer alerts
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

document.addEventListener("DOMContentLoaded", init);
