import { 
  detailPanelEl, descriptionInputEl, saveIndicatorEl, 
  appShell, detailTaskNameEl, dueDateDisplayEl, closePanelBtn 
} from "./dom.js";
import { formatIsoDate } from "./utils.js";
import { selectedDueDate, setSelectedDueDate, closeCalendar } from "./calendar.js";

// Export để task.js nhận biết nếu đang xoá task đang mở
export let activeTaskItem = null;
let autoSaveTimer  = null;

export function openPanel(taskItem) {
  if (activeTaskItem && activeTaskItem !== taskItem) {
    activeTaskItem.classList.remove("is-active");
  }

  activeTaskItem = taskItem;
  taskItem.classList.add("is-active");

  const data = taskItem._taskData || { desc: "", dueDate: "" };

  detailTaskNameEl.textContent   = taskItem.querySelector(".task-label").textContent;
  descriptionInputEl.value       = data.desc || "";
  
  // Dùng setter thay vì gán trực tiếp
  setSelectedDueDate(data.dueDate || "");
  dueDateDisplayEl.textContent   = selectedDueDate ? formatIsoDate(selectedDueDate) : "No due date";

  saveIndicatorEl.textContent = "";
  saveIndicatorEl.className   = "save-indicator";

  closeCalendar();

  detailPanelEl.classList.add("is-open");
  appShell.classList.add("panel-open");
}

export function closePanel() {
  if (activeTaskItem) {
    persistTaskData();
    activeTaskItem.classList.remove("is-active");
    activeTaskItem = null;
  }
  detailPanelEl.classList.remove("is-open");
  appShell.classList.remove("panel-open");
  closeCalendar();
}

closePanelBtn.addEventListener("click", closePanel);

detailTaskNameEl.addEventListener("input", () => {
  if (!activeTaskItem) return;
  const rowLabel = activeTaskItem.querySelector(".task-label");
  rowLabel.textContent = detailTaskNameEl.textContent.trim() || "";
  scheduleAutoSave();
});

detailTaskNameEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); detailTaskNameEl.blur(); }
});

detailTaskNameEl.addEventListener("blur", () => {
  if (detailTaskNameEl.textContent.trim() === "") detailTaskNameEl.innerHTML = "";
});

descriptionInputEl.addEventListener("input", scheduleAutoSave);

export function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  saveIndicatorEl.textContent = "Saving…";
  saveIndicatorEl.className   = "save-indicator";

  autoSaveTimer = setTimeout(() => {
    persistTaskData();
    saveIndicatorEl.textContent = "Saved";
    saveIndicatorEl.className   = "save-indicator is-saved";

    setTimeout(() => {
      saveIndicatorEl.textContent = "";
      saveIndicatorEl.className   = "save-indicator";
    }, 2000);
  }, 600);
}

function persistTaskData() {
  if (!activeTaskItem) return;

  activeTaskItem._taskData = {
    desc:    descriptionInputEl.value,
    dueDate: selectedDueDate,
  };

  const badge = activeTaskItem.querySelector(".due-badge");
  if (selectedDueDate) {
    badge.textContent = formatIsoDate(selectedDueDate);
    badge.classList.remove("is-hidden");
  } else {
    badge.textContent = "";
    badge.classList.add("is-hidden");
  }
}

detailTaskNameEl.addEventListener("paste", (e) => {
  if (!e.target.classList.contains("task-label")) return;
  e.preventDefault();
  let text = (e.clipboardData || window.clipboardData).getData('text');
  text = text.replace(/[\r\n]+/g, ' ');
  document.execCommand('insertText', false, text);
});