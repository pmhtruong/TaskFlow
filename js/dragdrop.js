import { dropDeleteZone, taskListEl } from "./dom.js";
import { deleteTaskItem } from "./tasks.js";

let draggedItem = null;

export function attachDragHandlers(li) {
  li.addEventListener("dragstart", onDragStart);
  li.addEventListener("dragend",   onDragEnd);
  li.addEventListener("dragover",  onDragOver);
  li.addEventListener("drop",      onDrop);
}

function onDragStart(e) {
  draggedItem = e.currentTarget;
  draggedItem.classList.add("is-dragging");

  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", ""); // required for Firefox

  dropDeleteZone.classList.add("is-visible");
}

function onDragEnd() {
  if (draggedItem) draggedItem.classList.remove("is-dragging");
  draggedItem = null;

  document.querySelectorAll(".drag-over-above, .drag-over-below").forEach(el => {
    el.classList.remove("drag-over-above", "drag-over-below");
  });

  dropDeleteZone.classList.remove("is-visible", "is-drag-over");
}

function onDragOver(e) {
  e.preventDefault(); 
  if (!draggedItem || e.currentTarget === draggedItem) return;

  const target = e.currentTarget;
  const rect   = target.getBoundingClientRect();
  const midY   = rect.top + rect.height / 2;

  target.classList.remove("drag-over-above", "drag-over-below");

  if (e.clientY < midY) {
    target.classList.add("drag-over-above");
  } else {
    target.classList.add("drag-over-below");
  }
}

function onDrop(e) {
  e.preventDefault();
  if (!draggedItem || e.currentTarget === draggedItem) return;

  const target = e.currentTarget;
  const rect   = target.getBoundingClientRect();
  const midY   = rect.top + rect.height / 2;

  if (e.clientY < midY) {
    taskListEl.insertBefore(draggedItem, target);
  } else {
    target.after(draggedItem);
  }

  target.classList.remove("drag-over-above", "drag-over-below");
}

dropDeleteZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropDeleteZone.classList.add("is-drag-over");
});

dropDeleteZone.addEventListener("dragleave", () => {
  dropDeleteZone.classList.remove("is-drag-over");
});

dropDeleteZone.addEventListener("drop", (e) => {
  e.preventDefault();
  if (draggedItem) deleteTaskItem(draggedItem);
  dropDeleteZone.classList.remove("is-drag-over");
});