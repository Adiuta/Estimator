// popup.js
export function openPopup(id) {
  document.querySelector(id)?.classList.remove("hidden");
}

export function closePopup(id) {
  document.querySelector(id)?.classList.add("hidden");
}

export function bindPopup(trigger, popup, closeBtn) {
  document.querySelector(trigger)?.addEventListener("click", () =>
    openPopup(popup)
  );
  document.querySelector(closeBtn)?.addEventListener("click", () =>
    closePopup(popup)
  );
}
