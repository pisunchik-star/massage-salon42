"use strict";

const storageKey = "lume-massage-bookings";
const bookingId = new URLSearchParams(window.location.search).get("booking");
const summary = document.querySelector("#payment-summary");
const paymentForm = document.querySelector("#payment-form");
const payButton = document.querySelector("#pay-button");
const result = document.querySelector("#payment-result");
const notificationStatus = document.querySelector("#notification-status");
if (
  new URLSearchParams(window.location.search).get("notification") === "sent"
) {
  notificationStatus.textContent =
    "Powiadomienie o rezerwacji zostało wysłane do studia.";
}
const serviceNames = {
  classic: "Masaż klasyczny",
  relax: "Masaż relaksacyjny",
  sport: "Masaż sportowy",
  "back-neck": "Masaż pleców i karku",
  "anti-cellulite": "Masaż antycellulitowy",
  "full-body": "Masaż całego ciała",
};

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
    const bookings = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(bookings)) return [];
    const privateDataRemoved = bookings.map((booking) => ({
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
    if (JSON.stringify(privateDataRemoved) !== JSON.stringify(bookings)) {
      localStorage.setItem(storageKey, JSON.stringify(privateDataRemoved));
    }
    return privateDataRemoved;
  } catch {
    return [];
  }
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showMissingBooking() {
  summary.innerHTML =
    '<dd class="payment-error">Nie znaleźliśmy tej rezerwacji. Wróć na stronę i umów wizytę ponownie.</dd>';
  payButton.disabled = true;
}

function displayBooking(booking) {
  const values = [
    ["Masaż", serviceNames[booking.serviceId] || booking.serviceName],
    ["Czas trwania", `${Number(booking.duration)} min`],
    ["Data", formatDate(booking.date)],
    ["Godzina", booking.time],
    ["Cena", `${Number(booking.price)} zł`],
  ];
  summary.innerHTML = values
    .map(
      ([label, value]) =>
        `<div class="payment-summary-row"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`,
    )
    .join("");

  if (booking.paymentMethod) {
    const savedMethod = paymentForm.querySelector(
      `input[value="${CSS.escape(booking.paymentMethod)}"]`,
    );
    if (savedMethod) savedMethod.checked = true;
  }
  if (booking.demoPaid) {
    result.textContent = "Płatność demonstracyjna zakończona pomyślnie.";
    payButton.textContent = "Płatność demo została potwierdzona";
  }
}

const bookings = readBookings();
const booking = bookings.find((item) => item.id === bookingId);
if (booking) displayBooking(booking);
else showMissingBooking();

paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!booking) return;

  const method = paymentForm.querySelector(
    'input[name="payment"]:checked',
  )?.value;
  const currentBookings = readBookings();
  const bookingIndex = currentBookings.findIndex(
    (item) => item.id === booking.id,
  );
  if (bookingIndex === -1) {
    showMissingBooking();
    return;
  }

  currentBookings[bookingIndex] = {
    ...currentBookings[bookingIndex],
    paymentMethod: method,
    demoPaid: true,
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(currentBookings));
  } catch {
    result.textContent =
      "Nie udało się zapisać wyniku. Sprawdź ustawienia pamięci przeglądarki.";
    return;
  }

  result.textContent = "Płatność demonstracyjna zakończona pomyślnie.";
  payButton.textContent = "Płatność demo została potwierdzona";
});
