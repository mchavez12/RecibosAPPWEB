
document.addEventListener("DOMContentLoaded", function () {
  const highContrastToggle = document.getElementById("highContrastToggle");
  const fontSizeSelector = document.getElementById("fontSizeSelector");
  const letterSpacingToggle = document.getElementById("letterSpacingToggle");
  const noAnimationsToggle = document.getElementById("noAnimationsToggle");
  const accessibleColorsToggle = document.getElementById("accessibleColorsToggle");
  const zoomSelector = document.getElementById("zoomSelector");
  const largePointerToggle = document.getElementById("largePointerToggle");

  if (localStorage.getItem("highContrastEnabled") === "true") {
    document.body.classList.add("high-contrast-mode");
    if (highContrastToggle) highContrastToggle.checked = true;
  }

  const savedFontSize = localStorage.getItem("fontSize");
  if (savedFontSize) {
    document.body.classList.add(savedFontSize);
    if (fontSizeSelector) fontSizeSelector.value = savedFontSize;
  }

  if (localStorage.getItem("letterSpacingEnabled") === "true") {
    document.body.classList.add("increased-letter-spacing");
    if (letterSpacingToggle) letterSpacingToggle.checked = true;
  }

  if (localStorage.getItem("noAnimationsEnabled") === "true") {
    document.body.classList.add("no-animations");
    if (noAnimationsToggle) noAnimationsToggle.checked = true;
  }

  if (localStorage.getItem("accessibleColorsEnabled") === "true") {
    document.body.classList.add("accessible-colors");
    if (accessibleColorsToggle) accessibleColorsToggle.checked = true;
  }

  const savedZoom = localStorage.getItem("zoomLevel");
  if (savedZoom) {
    document.body.style.zoom = savedZoom + '%';
    if (zoomSelector) zoomSelector.value = savedZoom;
  }

  if (localStorage.getItem("largePointerEnabled") === "true") {
    document.body.classList.add("large-pointer");
    if (largePointerToggle) largePointerToggle.checked = true;
  }

  if (highContrastToggle) {
    highContrastToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("high-contrast-mode");
        localStorage.setItem("highContrastEnabled", "true");
      } else {
        document.body.classList.remove("high-contrast-mode");
        localStorage.setItem("highContrastEnabled", "false");
      }
    });
  }

  if (fontSizeSelector) {
    fontSizeSelector.addEventListener("change", function () {
      document.body.classList.remove("large-font-size");
      document.body.classList.remove("default-font-size");
      if (this.value !== "default") {
        document.body.classList.add(this.value + "-font-size");
      }
      localStorage.setItem("fontSize", this.value + "-font-size");
    });
  }

  if (letterSpacingToggle) {
    letterSpacingToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("increased-letter-spacing");
        localStorage.setItem("letterSpacingEnabled", "true");
      } else {
        document.body.classList.remove("increased-letter-spacing");
        localStorage.setItem("letterSpacingEnabled", "false");
      }
    });
  }

  if (noAnimationsToggle) {
    noAnimationsToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("no-animations");
        localStorage.setItem("noAnimationsEnabled", "true");
      } else {
        document.body.classList.remove("no-animations");
        localStorage.setItem("noAnimationsEnabled", "false");
      }
    });
  }

  if (accessibleColorsToggle) {
    accessibleColorsToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("accessible-colors");
        localStorage.setItem("accessibleColorsEnabled", "true");
      } else {
        document.body.classList.remove("accessible-colors");
        localStorage.setItem("accessibleColorsEnabled", "false");
      }
    });
  }

  if (zoomSelector) {
    zoomSelector.addEventListener("change", function () {
      document.body.style.zoom = this.value + '%';
      localStorage.setItem("zoomLevel", this.value);
    });
  }

  if (largePointerToggle) {
    largePointerToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("large-pointer");
        localStorage.setItem("largePointerEnabled", "true");
      } else {
        document.body.classList.remove("large-pointer");
        localStorage.setItem("largePointerEnabled", "false");
      }
    });
  }
});
