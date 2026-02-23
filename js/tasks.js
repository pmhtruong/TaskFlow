import { 
  taskInputEl, taskListEl, MAX_TASK_LENGTH, 
  addTaskBtn, deleteSelectedBtn 
} from "./dom.js";
import { openPanel, closePanel, activeTaskItem } from "./panel.js";
import { attachDragHandlers } from "./dragdrop.js";

function createTaskItem(text) {
  const li = document.createElement("li");
  li.className  = "task-item";
  li.draggable  = true;

  li.innerHTML = `
    <span class="material-symbols-outlined drag-handle" title="Drag to reorder">
      drag_indicator
    </span>
    <span class="material-symbols-outlined checkbox-icon" title="Mark complete">
      radio_button_unchecked
    </span>
    <span class="task-label" contenteditable="true"></span>
    
    <button class="open-panel-btn" title="Open in side peek">
      <span class="material-symbols-outlined">open_in_new</span>
      OPEN
    </button>

    <span class="due-badge is-hidden"></span>
    <span class="material-symbols-outlined delete-btn" title="Delete task">
      delete
    </span>
  `;

  li.querySelector(".task-label").textContent = text;
  li._taskData = { desc: "", dueDate: "" };

  taskListEl.appendChild(li);
  attachDragHandlers(li);
  return li;
}

// ==== LOGIC THÊM TASK MỚI ====
function handleAddNewTask() {
  let text = taskInputEl.value.trim();
  if (!text) return;

  if (text.length > MAX_TASK_LENGTH) {
    text = text.substring(0, MAX_TASK_LENGTH) + "…";
  }

  const newItem = createTaskItem(text);
  taskInputEl.value = "";
  // openPanel(newItem);
}

// 1. Thêm bằng phím Enter
taskInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddNewTask();
  }
});

// 2. Thêm bằng Click vào Icon Add
if (addTaskBtn) {
  addTaskBtn.addEventListener("click", handleAddNewTask);
}

// ==== CÁC SỰ KIỆN TRÊN DANH SÁCH TASK ====
taskListEl.addEventListener("click", (e) => {
  const taskItem = e.target.closest(".task-item");
  if (!taskItem) return;

  if (e.target.classList.contains("checkbox-icon")) {
    toggleTaskDone(taskItem, e.target);
    return;
  }

  if (e.target.classList.contains("delete-btn")) {
    deleteTaskItem(taskItem);
    return;
  }

  const openBtn = e.target.closest(".open-panel-btn");
  if (openBtn) {
    openPanel(taskItem);
    return;
  }
});

taskListEl.addEventListener("keydown", (e) => {
  if (!e.target.classList.contains("task-label")) return;

  if (e.key === "Enter") {
    e.preventDefault();
    e.target.blur();
    return;
  }

  if (e.key === "Backspace" && e.target.textContent.trim() === "") {
    e.preventDefault();
    const item = e.target.closest(".task-item");
    const prevSibling = item.previousElementSibling;
    deleteTaskItem(item);
    if (prevSibling) prevSibling.querySelector(".task-label").focus();
  }
});

taskListEl.addEventListener("input", (e) => {
  if (!e.target.classList.contains("task-label")) return;
  if (e.target.textContent.length > MAX_TASK_LENGTH) {
    e.target.textContent = e.target.textContent.slice(0, MAX_TASK_LENGTH);
  }
});

// Ngăn copy/paste nhiều dòng gây vỡ giao diện
taskListEl.addEventListener("paste", (e) => {
  if (!e.target.classList.contains("task-label")) return;
  e.preventDefault();
  let text = (e.clipboardData || window.clipboardData).getData('text');
  text = text.replace(/[\r\n]+/g, ' '); // Biến enter thành dấu cách
  document.execCommand('insertText', false, text);
});

// ==== LOGIC CHECK TASK & NÚT XÓA NHIỀU ====
function toggleTaskDone(taskItem, checkboxIcon) {
  const isDone = checkboxIcon.textContent.trim() === "check_circle";
  checkboxIcon.textContent = isDone ? "radio_button_unchecked" : "check_circle";
  taskItem.classList.toggle("is-done", !isDone);
  checkDeleteSelectedBtn();
}

function checkDeleteSelectedBtn() {
  if (!deleteSelectedBtn) return;
  const doneTasks = document.querySelectorAll(".task-item.is-done");
  if (doneTasks.length > 0) {
    deleteSelectedBtn.classList.remove("is-hidden");
  } else {
    deleteSelectedBtn.classList.add("is-hidden");
  }
}

if (deleteSelectedBtn) {
  deleteSelectedBtn.addEventListener("click", () => {
    const doneTasks = document.querySelectorAll(".task-item.is-done");
    doneTasks.forEach(task => deleteTaskItem(task));
    checkDeleteSelectedBtn();
  });
}

export function deleteTaskItem(taskItem) {
  if (taskItem === activeTaskItem) closePanel();
  taskItem.remove();
  checkDeleteSelectedBtn(); // Cập nhật lại nút xóa nếu task bị xóa ngang
}