"use strict";

const salon = {
  name: "LUME",
  phone: "606569831",
  email: "ilonadavydova43@gmail.com",
};

const services = [
  {
    id: "classic",
    name: "Masaż klasyczny",
    description:
      "Klasyczna technika, która pomaga rozluźnić ciało i odzyskać lekkość.",
    durations: [
      { minutes: 30, price: 80 },
      { minutes: 60, price: 140 },
      { minutes: 90, price: 190 },
    ],
  },
  {
    id: "relax",
    name: "Masaż relaksacyjny",
    description: "Płynne, rytmiczne ruchy pomagają zwolnić i odzyskać siły.",
    durations: [
      { minutes: 30, price: 90 },
      { minutes: 60, price: 150 },
      { minutes: 90, price: 210 },
    ],
  },
  {
    id: "sport",
    name: "Masaż sportowy",
    description:
      "Praca z mięśniami po wysiłku wspiera regenerację i swobodę ruchu.",
    durations: [
      { minutes: 30, price: 100 },
      { minutes: 60, price: 170 },
      { minutes: 90, price: 230 },
    ],
  },
  {
    id: "back-neck",
    name: "Masaż pleców i karku",
    description:
      "Skupienie na miejscach, w których najczęściej gromadzi się napięcie.",
    durations: [
      { minutes: 30, price: 90 },
      { minutes: 60, price: 150 },
    ],
  },
  {
    id: "anti-cellulite",
    name: "Masaż antycellulitowy",
    description:
      "Intensywna technika wspierająca jędrność skóry i mikrokrążenie.",
    durations: [
      { minutes: 45, price: 120 },
      { minutes: 60, price: 160 },
      { minutes: 90, price: 220 },
    ],
  },
  {
    id: "full-body",
    name: "Masaż całego ciała",
    description:
      "Kompleksowy rytuał głębokiego relaksu — od głowy aż po koniuszki palców.",
    durations: [
      { minutes: 60, price: 160 },
      { minutes: 90, price: 220 },
      { minutes: 120, price: 280 },
    ],
  },
];

const storageKey = "lume-massage-bookings";
const serviceGrid = document.querySelector("#service-grid");
const bookingForm = document.querySelector("#booking-form");
const serviceSelect = document.querySelector("#service-select");
const durationSelect = document.querySelector("#duration-select");
const dateInput = document.querySelector("#booking-date");
const timeSelect = document.querySelector("#time-select");
const formTotal = document.querySelector("#form-total");
const feedback = document.querySelector("#form-feedback");
const bookingList = document.querySelector("#booking-list");

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function readBookings() {
  try {
    const savedBookings = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(savedBookings)) return [];
    const privateDataRemoved = savedBookings.map((booking) => ({
      id: String(booking.id),
      serviceId: String(booking.serviceId),
      serviceName: String(booking.serviceName),
      duration: Number(booking.duration),
      price: Number(booking.price),
      date: String(booking.date),
      time: String(booking.time),
      ...(booking.paymentMethod
        ? { paymentMethod: String(booking.paymentMethod) }
        : {}),
      ...(booking.demoPaid ? { demoPaid: true } : {}),
    }));
    if (JSON.stringify(privateDataRemoved) !== JSON.stringify(savedBookings)) {
      localStorage.setItem(storageKey, JSON.stringify(privateDataRemoved));
    }
    return privateDataRemoved;
  } catch (error) {
    console.error("Nie udało się odczytać rezerwacji z localStorage:", error);
    return [];
  }
}

function saveBookings(bookings) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(bookings));
    return true;
  } catch (error) {
    console.error("Nie udało się zapisać rezerwacji:", error);
    feedback.textContent =
      "Przeglądarka nie pozwoliła zapisać rezerwacji. Sprawdź ustawienia pamięci lokalnej.";
    return false;
  }
}

async function sendBookingEmail(booking, contact) {
  const response = await fetch(`https://formsubmit.co/ajax/${salon.email}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      service: booking.serviceName,
      duration: `${booking.duration} min`,
      date: booking.date,
      time: booking.time,
      price: formatPrice(booking.price),
      comment: contact.comment || "—",
      _subject: `Nowa rezerwacja: ${booking.serviceName}`,
      _template: "table",
    }),
  });
  const result = await response.json();
  if (!response.ok || ![true, "true"].includes(result.success)) {
    throw new Error(result.message || "Nie udało się wysłać rezerwacji.");
  }
}

function formatPrice(price) {
  return `${price} zł`;
}

function renderServices() {
  serviceGrid.innerHTML = services
    .map((service, index) => {
      const priceChips = service.durations
        .map(
          (option) =>
            `<span class="price-chip">${option.minutes} min <strong>${formatPrice(option.price)}</strong></span>`,
        )
        .join("");
      return `<article class="service-card"><span class="service-number">0${index + 1}</span><h3>${escapeHTML(service.name)}</h3><p>${escapeHTML(service.description)}</p><div class="service-prices">${priceChips}</div><div class="service-footer"><span class="service-starting">od ${formatPrice(service.durations[0].price)}</span><a class="text-link" href="#booking" data-book-service="${escapeHTML(service.id)}">Umów wizytę <span aria-hidden="true">↗</span></a></div></article>`;
    })
    .join("");

  serviceSelect.innerHTML =
    '<option value="">Wybierz masaż</option>' +
    services
      .map(
        (service) =>
          `<option value="${escapeHTML(service.id)}">${escapeHTML(service.name)}</option>`,
      )
      .join("");
}

function getSelectedService() {
  return services.find((service) => service.id === serviceSelect.value);
}

function updateDurationOptions() {
  const service = getSelectedService();
  durationSelect.innerHTML = service
    ? '<option value="">Wybierz czas trwania</option>' +
      service.durations
        .map(
          (option) =>
            `<option value="${option.minutes}">${option.minutes} min — ${formatPrice(option.price)}</option>`,
        )
        .join("")
    : '<option value="">Najpierw wybierz masaż</option>';
  durationSelect.disabled = !service;
  updatePrice();
  updateTimeOptions();
}

function updatePrice() {
  const service = getSelectedService();
  const choice = service?.durations.find(
    (option) => option.minutes === Number(durationSelect.value),
  );
  formTotal.textContent = choice
    ? `Cena: ${formatPrice(choice.price)}`
    : "Cena pojawi się po wybraniu masażu";
}

function dateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function updateTimeOptions() {
  const selectedDate = dateInput.value;
  const duration = Number(durationSelect.value);
  timeSelect.innerHTML = "";
  timeSelect.disabled = true;
  if (!selectedDate) {
    timeSelect.innerHTML = '<option value="">Najpierw wybierz datę</option>';
    return;
  }

  const date = new Date(`${selectedDate}T12:00:00`);
  const day = date.getDay();
  const closingHour = day === 6 ? 18 : 20;
  if (day === 0) {
    timeSelect.innerHTML =
      '<option value="">Studio jest zamknięte w niedzielę</option>';
    return;
  }

  const availableTimes = [];
  const now = new Date();
  const today = dateString(now);
  const bookings = readBookings();
  for (
    let minutes = 10 * 60;
    minutes + (duration || 0) <= closingHour * 60;
    minutes += 30
  ) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    if (
      selectedDate === today &&
      minutes <= now.getHours() * 60 + now.getMinutes()
    )
      continue;

    const proposedEnd = minutes + duration;
    const overlaps = bookings.some((booking) => {
      if (booking.date !== selectedDate) return false;
      const [bookedHours, bookedMinutes] = booking.time.split(":").map(Number);
      const bookedStart = bookedHours * 60 + bookedMinutes;
      return (
        minutes < bookedStart + Number(booking.duration) &&
        proposedEnd > bookedStart
      );
    });
    if (!overlaps) availableTimes.push(time);
  }

  if (availableTimes.length === 0) {
    timeSelect.innerHTML = '<option value="">Brak wolnych terminów</option>';
    return;
  }
  timeSelect.innerHTML =
    '<option value="">Wybierz godzinę</option>' +
    availableTimes
      .map((time) => `<option value="${time}">${time}</option>`)
      .join("");
  timeSelect.disabled = false;
}

function displayDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function bookingCountLabel(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return "rezerwacji";
  if (lastDigit === 1) return "rezerwacja";
  if (lastDigit >= 2 && lastDigit <= 4) return "rezerwacje";
  return "rezerwacji";
}

function renderBookings() {
  const bookings = readBookings().sort((first, second) =>
    `${first.date} ${first.time}`.localeCompare(
      `${second.date} ${second.time}`,
    ),
  );
  document.querySelector("#booking-count").textContent =
    `${bookings.length} ${bookingCountLabel(bookings.length)}`;
  if (bookings.length === 0) {
    bookingList.innerHTML =
      '<div class="booking-empty">Nie masz jeszcze rezerwacji. Wybierz masaż i utwórz pierwszą rezerwację demonstracyjną.</div>';
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => {
      const serviceName =
        services.find((service) => service.id === booking.serviceId)?.name ||
        booking.serviceName;
      return `<article class="booking-row"><div class="booking-cell"><span>Masaż</span><strong>${escapeHTML(serviceName)}</strong></div><div class="booking-cell"><span>Czas trwania</span><strong>${Number(booking.duration)} min</strong></div><div class="booking-cell"><span>Data i godzina</span><strong>${escapeHTML(displayDate(booking.date))}, ${escapeHTML(booking.time)}</strong></div><div class="booking-cell"><span>Cena</span><strong>${formatPrice(Number(booking.price))}</strong></div><button class="delete-booking" type="button" data-delete-booking="${escapeHTML(booking.id)}" aria-label="Usuń rezerwację: ${escapeHTML(serviceName)}, ${escapeHTML(booking.date)} ${escapeHTML(booking.time)}">Usuń</button></article>`;
    })
    .join("");
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  feedback.textContent = "";
  if (!bookingForm.reportValidity()) return;

  const service = getSelectedService();
  const choice = service?.durations.find(
    (option) => option.minutes === Number(durationSelect.value),
  );
  if (!service || !choice || !timeSelect.value) {
    feedback.textContent = "Wybierz masaż, czas trwania, datę i wolną godzinę.";
    return;
  }
  if (new Date(`${dateInput.value}T${timeSelect.value}:00`) <= new Date()) {
    feedback.textContent = "Wybierz przyszłą datę i godzinę.";
    updateTimeOptions();
    return;
  }

  const formData = new FormData(bookingForm);
  const booking = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    serviceId: service.id,
    serviceName: service.name,
    duration: choice.minutes,
    price: choice.price,
    date: String(formData.get("date")),
    time: String(formData.get("time")),
  };
  const contact = {
    name: String(formData.get("name")).trim(),
    phone: String(formData.get("phone")).trim(),
    email: String(formData.get("email")).trim(),
    comment: String(formData.get("comment")).trim(),
  };
  const bookings = readBookings();
  const [hours, minutes] = booking.time.split(":").map(Number);
  const start = hours * 60 + minutes;
  const collision = bookings.some((saved) => {
    if (saved.date !== booking.date) return false;
    const [savedHours, savedMinutes] = saved.time.split(":").map(Number);
    const savedStart = savedHours * 60 + savedMinutes;
    return (
      start < savedStart + Number(saved.duration) &&
      start + booking.duration > savedStart
    );
  });
  if (collision) {
    feedback.textContent =
      "Ten termin jest już zajęty. Wybierz inną wolną godzinę.";
    updateTimeOptions();
    return;
  }
  if (!saveBookings([...bookings, booking])) return;

  const submitButton = bookingForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  feedback.textContent = "Wysyłanie rezerwacji do studia…";
  try {
    await sendBookingEmail(booking, contact);
  } catch (error) {
    console.error("Nie udało się wysłać rezerwacji:", error);
    saveBookings(readBookings().filter((saved) => saved.id !== booking.id));
    submitButton.disabled = false;
    feedback.textContent =
      "Nie udało się wysłać rezerwacji. Sprawdź połączenie i spróbuj ponownie.";
    renderBookings();
    updateTimeOptions();
    return;
  }

  const paymentUrl = new URL("payment.html", window.location.href);
  paymentUrl.searchParams.set("booking", booking.id);
  paymentUrl.searchParams.set("notification", "sent");
  window.location.href = paymentUrl;
}

function initialize() {
  document.title = `${salon.name} — studio masażu`;
  document.querySelector(".brand-name").innerHTML =
    `${escapeHTML(salon.name)}<span class="brand-dot">.</span><small>studio masażu</small>`;
  document
    .querySelector(".brand")
    .setAttribute("aria-label", `${salon.name} — strona główna`);
  document.querySelector(".footer-brand").innerHTML =
    `${escapeHTML(salon.name)}<span>.</span>`;
  document.querySelector("#current-year").textContent =
    new Date().getFullYear();
  document.querySelector("#contact-phone").textContent = salon.phone;
  document.querySelector("#contact-email").textContent = salon.email;
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.href = `tel:${salon.phone}`;
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.href = `mailto:${salon.email}`;
  });
  dateInput.min = dateString(new Date());
  renderServices();
  renderBookings();

  serviceGrid.addEventListener("click", (event) => {
    const link = event.target.closest("[data-book-service]");
    if (!link) return;
    serviceSelect.value = link.dataset.bookService;
    updateDurationOptions();
    bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  serviceSelect.addEventListener("change", updateDurationOptions);
  durationSelect.addEventListener("change", () => {
    updatePrice();
    updateTimeOptions();
  });
  dateInput.addEventListener("change", updateTimeOptions);
  bookingForm.addEventListener("submit", handleBookingSubmit);
  bookingList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-booking]");
    if (!button) return;
    saveBookings(
      readBookings().filter(
        (booking) => booking.id !== button.dataset.deleteBooking,
      ),
    );
    renderBookings();
    updateTimeOptions();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    renderBookings();
    updateTimeOptions();
  });
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector("#main-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Otwórz menu" : "Zamknij menu",
    );
    mainNav.classList.toggle("is-open", !isOpen);
  });
  mainNav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Otwórz menu");
  });
}

initialize();
