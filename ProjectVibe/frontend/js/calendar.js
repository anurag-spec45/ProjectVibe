// Renders the month grid and wires day-click -> event list.
const CalendarView = (() => {
  let currentDate = new Date();
  let eventsByDate = {};

  function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  async function load() {
    document.getElementById("calendarLabel").textContent = currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    eventsByDate = await Api.getCalendar(monthKey(currentDate));
    render();
  }

  function render() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-day empty";
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = eventsByDate[iso] || [];

      const cell = document.createElement("div");
      cell.className = "calendar-day" + (dayEvents.length ? " has-events" : "");
      cell.innerHTML = `<div class="day-num">${day}</div>` +
        (dayEvents.length ? `<div class="dot-count">${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}</div>` : "");
      cell.addEventListener("click", () => selectDay(cell, dayEvents));
      grid.appendChild(cell);
    }
  }

  function selectDay(cell, dayEvents) {
    document.querySelectorAll(".calendar-day.selected").forEach((el) => el.classList.remove("selected"));
    cell.classList.add("selected");
    EventCards.renderList(document.getElementById("dayEvents"), dayEvents);
  }

  function shiftMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    load();
  }

  return { load, shiftMonth };
})();
