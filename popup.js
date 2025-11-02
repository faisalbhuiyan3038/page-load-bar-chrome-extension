// --- Get Default Settings ---
const defaults = {
    color: "#FF0000",
    isRainbow: true,
    rainbow_size: 3,
    width: "2",
    opacity: "0.75",
    place: "top",
    smooth: "no",
    showCounter: true
};

// --- Save Options ---
function saveOptions() {
  chrome.storage.local.set({
    "color": document.querySelector("#color").value,
    "width": document.querySelector("#width").value,
    "isRainbow": document.querySelector("#isRainbow").checked,
    "rainbow_size": document.querySelector("#rainbow_size").value,
    "opacity": document.querySelector("#opacity").value,
    "place": document.querySelector("#place").value,
    "smooth": document.querySelector("#smooth").value,
    "showCounter": document.querySelector("#showCounter").checked
  });
}

// --- Restore Options ---
function restoreOptions() {
  chrome.storage.local.get(defaults).then((result) => {
    document.querySelector("#color").value = result.color;
    document.querySelector("#width").value = result.width;
    document.querySelector("#isRainbow").checked = result.isRainbow;
    document.querySelector("#rainbow_size").value = result.rainbow_size;
    document.querySelector("#opacity").value = result.opacity;
    document.querySelector("#place").value = result.place;
    document.querySelector("#smooth").value = result.smooth;
    document.querySelector("#showCounter").checked = result.showCounter;
  }, (error) => {
    console.log(`Error: ${error}`);
  });
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", restoreOptions);

// Add save-on-change listeners to all inputs
document.querySelectorAll("select").forEach((i) => i.addEventListener("change", saveOptions));
document.querySelectorAll("input").forEach((i) => i.addEventListener("change", saveOptions));

// Listener for the "Open Full Options" link
document.querySelector("#open-options").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});