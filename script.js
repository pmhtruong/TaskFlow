// ===== SELECT ELEMENTS =====
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const projectTitle = document.getElementById("projectTitle");

// ===== CONFIG =====
const MAX_TASK_LENGTH = 60;
const MAX_TITLE_LENGTH = 40;

// ===== PREVENT ENTER IN TITLE =====
projectTitle.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    projectTitle.blur();
  }
});

// limit title length
projectTitle.addEventListener("input", () => {
  if (projectTitle.textContent.length > MAX_TITLE_LENGTH) {
    projectTitle.textContent = projectTitle.textContent.slice(0, MAX_TITLE_LENGTH);
  }
});

// ===== FIX EMPTY PROJECT TITLE =====
projectTitle.addEventListener("blur", () => {

  const text = projectTitle.textContent.trim();

  if (text === "") {
    projectTitle.innerHTML = "";
  }

});

// ===== ADD TASK FUNCTION =====
function createTask(text) {

  const li = document.createElement("li");
  li.className = "task-item";

  li.innerHTML = `
    <span class="material-symbols-outlined checkbox">radio_button_unchecked</span>
    <span class="task-text" contenteditable="true"></span>
    <span class="material-symbols-outlined delete-btn">delete</span>
  `;

  const taskText = li.querySelector(".task-text");
  taskText.textContent = text;

  taskList.appendChild(li);
}

// ===== ADD TASK WITH ENTER =====
taskInput.addEventListener("keydown", (e) => {

  if (e.key === "Enter") {

    let text = taskInput.value.trim();

    if (!text) return;

    // If too long → cut and add ...
    if (text.length > MAX_TASK_LENGTH) {
      text = text.substring(0, MAX_TASK_LENGTH) + "...";
    }

    createTask(text);
    taskInput.value = "";
  }
});


// ===== EVENT DELEGATION =====
taskList.addEventListener("click", (e) => {

  const taskItem = e.target.closest(".task-item");
  if (!taskItem) return;

  // toggle checkbox
  if (e.target.classList.contains("checkbox")) {

    const icon = e.target;

    if (icon.textContent === "radio_button_unchecked") {
      icon.textContent = "check_circle";
      taskItem.classList.add("completed");
    } else {
      icon.textContent = "radio_button_unchecked";
      taskItem.classList.remove("completed");
    }
  }

  // delete
  if (e.target.classList.contains("delete-btn")) {
    taskItem.remove();
  }

});

// ===== PREVENT ENTER IN TASK TEXT =====
taskList.addEventListener("keydown", (e) => {

  if (!e.target.classList.contains("task-text")) return;

  if (e.key === "Enter") {
    e.preventDefault();
    e.target.blur();
  }

});

// ===== LIMIT TASK TEXT LENGTH =====
taskList.addEventListener("input", (e) => {

  if (!e.target.classList.contains("task-text")) return;

  if (e.target.textContent.length > MAX_TASK_LENGTH) {
    e.target.textContent = e.target.textContent.slice(0, MAX_TASK_LENGTH);
  }

});

// ===== DELETE TASK WITH BACKSPACE WHEN EMPTY =====
taskList.addEventListener("keydown", (e) => {

  if (!e.target.classList.contains("task-text")) return;

  const text = e.target.textContent.trim();

  if (e.key === "Backspace" && text === "") {

    e.preventDefault();

    const taskItem = e.target.closest(".task-item");
    const prev = taskItem.previousElementSibling;

    taskItem.remove();

    // focus previous task
    if (prev) {
      const prevText = prev.querySelector(".task-text");
      prevText.focus();
    }
  }

});