import { 
    calPanelEl, dueDateTriggerEl, dueDateChevronEl, 
    dueDateDisplayEl, MONTH_NAMES, WEEKDAY_ABBR 
} from "./dom.js";
import { formatIsoDate } from "./utils.js";
import { scheduleAutoSave } from "./panel.js";

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */

/** * Currently selected due date in ISO format (YYYY-MM-DD). 
 * @type {string} 
 */
export let selectedDueDate = ""; 

/** @type {number|null} Current year being viewed in the calendar */
let calViewYear = null;
/** @type {number|null} Current month being viewed in the calendar (0-11) */
let calViewMonth = null;

/* ==========================================================================
   PUBLIC API / EXPORTS
   ========================================================================== */

/**
 * Updates the selected due date state.
 * @param {string} val - The date string in ISO format (YYYY-MM-DD).
 */
export function setSelectedDueDate(val) {
    selectedDueDate = val;
}

/**
 * Toggles the visibility of the calendar panel.
 * Initializes the view state based on the selected date or current date.
 */
export function toggleCalendar() {
    const isOpen = !calPanelEl.classList.contains("is-hidden");
    if (isOpen) { 
        closeCalendar(); 
        return; 
    }

    // Initialize calendar view to the selected date, or today if none selected
    const baseDate = selectedDueDate ? new Date(selectedDueDate + "T00:00:00") : new Date();
    calViewYear = baseDate.getFullYear();
    calViewMonth = baseDate.getMonth();

    renderCalendar();
    
    calPanelEl.classList.remove("is-hidden");
    dueDateChevronEl.classList.add("is-rotated");
}

/**
 * Closes the calendar panel and resets UI indicators.
 */
export function closeCalendar() {
    calPanelEl.classList.add("is-hidden");
    dueDateChevronEl.classList.remove("is-rotated");
}

/* ==========================================================================
   CORE RENDERING LOGIC
   ========================================================================== */

/**
 * Renders the calendar UI including navigation, days grid, and footer buttons.
 * * @note [SENIOR DEV WARNING]: Attaching event listeners inside a render function 
 * that is called repeatedly can lead to memory leaks and duplicated event triggers.
 * Consider refactoring to attach static listeners once and use event delegation.
 */
function renderCalendar() {
    const year  = calViewYear;
    const month = calViewMonth;

    // Get midnight timestamp for 'today' highlight comparison
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const firstWeekdayOfMonth = new Date(year, month, 1).getDay();
    const daysInThisMonth     = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth     = new Date(year, month, 0).getDate();

    // 1. Generate year dropdown options (1950 - 2050)
    let yearOptions = '';
    for (let y = 1950; y <= 2050; y++) {
        const isActive = y === year ? 'is-active' : '';
        yearOptions += `<div class="dropdown-item ${isActive}" data-year="${y}">${y}</div>`;
    }

    // 2. Build Calendar Navigation (Header)
    let html = `
        <div class="cal-nav" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 5px 15px;">
            <button class="cal-nav-btn" id="calPrevBtn">
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
          
            <div class="cal-month-year" style="display: flex; gap: 8px; justify-content: center; align-items: center; flex: 1;">
                
                <div class="custom-dropdown" id="monthDropdown">
                    <div class="dropdown-selected" id="monthSelected">
                        <span id="monthSelectedText">${MONTH_NAMES[month]}</span>
                        <span class="material-symbols-outlined dropdown-arrow">expand_more</span>
                    </div>
                    <div class="dropdown-list" id="monthList">
                        ${MONTH_NAMES.map((m, i) => `<div class="dropdown-item ${i === month ? 'is-active' : ''}" data-month="${i}">${m}</div>`).join('')}
                    </div>
                </div>

                <div class="custom-dropdown" id="yearDropdown" style="min-width: 90px;">
                    <div class="dropdown-selected" id="yearSelected">
                        <span id="yearSelectedText">${year}</span>
                        <span class="material-symbols-outlined dropdown-arrow">expand_more</span>
                    </div>
                    <div class="dropdown-list" id="yearList">
                        ${yearOptions}
                    </div>
                </div>

            </div>

            <button class="cal-nav-btn" id="calNextBtn">
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
        <div class="cal-grid">
    `;
    
    // 3. Build Weekday Headers
    WEEKDAY_ABBR.forEach(abbr => {
        html += `<div class="cal-weekday-header">${abbr}</div>`;
    });

    // 4. Build Previous Month Trailing Days
    for (let i = 0; i < firstWeekdayOfMonth; i++) {
        const day = daysInPrevMonth - firstWeekdayOfMonth + 1 + i;
        html += `<div class="cal-day-cell is-other-month">${day}</div>`;
    }

    // 5. Build Current Month Days
    for (let day = 1; day <= daysInThisMonth; day++) {
        const iso = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const cellDate = new Date(year, month, day);

        let classes = "cal-day-cell";
        if (iso === selectedDueDate) {
            classes += " is-selected";
        } else if (cellDate.getTime() === todayMidnight.getTime()) {
            classes += " is-today";
        }

        html += `<div class="${classes}" data-date="${iso}">${day}</div>`;
    }

    // 6. Build Next Month Leading Days to complete the grid
    const totalCells = firstWeekdayOfMonth + daysInThisMonth;
    const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainder; day++) {
        html += `<div class="cal-day-cell is-other-month">${day}</div>`;
    }

    html += `</div>`; // Close cal-grid

    // 7. Build Footer Controls
    html += `
        <div class="cal-footer" style="display: flex; gap: 10px;">
            <button class="cal-clear-btn" id="calTodayBtn" style="flex: 1;">Today</button>
            <button class="cal-clear-btn" id="calClearBtn" style="flex: 1;">Clear date</button>
        </div>
    `;

    // Inject HTML into the DOM
    calPanelEl.innerHTML = html;

    /* ------------------------------------------------------------------------
       INNER EVENT BINDINGS
       (Note: Bound dynamically due to HTML recreation on every render)
       ------------------------------------------------------------------------ */

    // Navigate to previous month
    document.getElementById("calPrevBtn").addEventListener("click", () => {
        calViewMonth--;
        if (calViewMonth < 0) {
            calViewMonth = 11;
            calViewYear--; 
        }
        renderCalendar();
    });

    // Navigate to next month
    document.getElementById("calNextBtn").addEventListener("click", () => {
        calViewMonth++;
        if (calViewMonth > 11) {
            calViewMonth = 0; 
            calViewYear++; 
        }
        renderCalendar();
    });

    // Clear selected date
    document.getElementById("calClearBtn").addEventListener("click", clearSelectedDate);

    // Jump to Today
    document.getElementById("calTodayBtn").addEventListener("click", () => {
        const now = new Date();
        
        calViewMonth = now.getMonth();
        calViewYear = now.getFullYear();
        
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        selectedDueDate = todayIso;
        
        renderCalendar();
    });

    /* --- Custom Dropdown Handlers --- */
    const monthDropdown = document.getElementById('monthDropdown');
    const monthList = document.getElementById('monthList');
    const yearDropdown = document.getElementById('yearDropdown');
    const yearList = document.getElementById('yearList');

    // Toggle Month Dropdown
    document.getElementById('monthSelected').addEventListener('click', (e) => {
        e.stopPropagation();
        yearList.classList.remove('show'); 
        monthList.classList.toggle('show');
    });

    // Toggle Year Dropdown
    document.getElementById('yearSelected').addEventListener('click', (e) => {
        e.stopPropagation();
        monthList.classList.remove('show'); 
        yearList.classList.toggle('show');
        
        // Auto-scroll to active year
        const activeYear = yearList.querySelector('.is-active');
        if (activeYear && yearList.classList.contains('show')) {
            yearList.scrollTop = activeYear.offsetTop - 50;
        }
    });

    // Handle Month Selection
    document.querySelectorAll('#monthList .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            calViewMonth = parseInt(e.target.getAttribute('data-month'), 10);
            renderCalendar(); 
        });
    });

    // Handle Year Selection
    document.querySelectorAll('#yearList .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            calViewYear = parseInt(e.target.getAttribute('data-year'), 10);
            renderCalendar(); 
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Warning: This creates a new global listener every time renderCalendar is called.
        if (monthDropdown && !monthDropdown.contains(e.target)) {
            monthList.classList.remove('show');
        }
        if (yearDropdown && !yearDropdown.contains(e.target)) {
            yearList.classList.remove('show');
        }
    });
}

/* ==========================================================================
   GLOBAL EVENT LISTENERS & HANDLERS
   ========================================================================== */

/**
 * Clears the selected date, updates the UI, and triggers auto-save.
 */
function clearSelectedDate() {
    selectedDueDate = "";
    dueDateDisplayEl.textContent = "No due date";
    renderCalendar();
    scheduleAutoSave();
}

/**
 * Event Delegation for Date Selection.
 * Listens for clicks on valid day cells within the calendar grid.
 */
calPanelEl.addEventListener("click", (e) => {
    const cell = e.target.closest(".cal-day-cell:not(.is-other-month)");
    if (!cell?.dataset.date) return; 
    
    selectedDueDate = cell.dataset.date;
    dueDateDisplayEl.textContent = formatIsoDate(selectedDueDate);
    renderCalendar();
    scheduleAutoSave();
});

/**
 * Main trigger to open/close the calendar panel.
 */
dueDateTriggerEl.addEventListener("click", toggleCalendar);