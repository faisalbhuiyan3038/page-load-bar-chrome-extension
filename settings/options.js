function saveOptions(e) {
  e.preventDefault();
  chrome.storage.local.set({
    "color": document.querySelector("#color").value,
    "width": document.querySelector("#width").value,
    "isRainbow": document.querySelector("#isRainbow").checked,
    "rainbow_size": document.querySelector("#rainbow_size").value,
    "opacity": document.querySelector("#opacity").value,
    "place": document.querySelector("#place").value,
    "smooth": document.querySelector("#smooth").value,
    "showCounter": document.querySelector("#showCounter").checked,
    "showStatusBar": document.querySelector("#showStatusBar").checked,
    "statusBarMode": document.querySelector("#statusBarMode").value,
    "showThirdPartyOnly": document.querySelector("#showThirdPartyOnly").checked
  }).then(() => {
    // Show save confirmation
    var status = document.querySelector("#status");
    status.textContent = "Settings saved!";
    setTimeout(() => {
      status.textContent = "";
    }, 1500);
  });
}

function restoreOptions() {
  function updateSettings(result) {
    document.querySelector("#color").value = result.color;
    document.querySelector("#width").value = result.width;
    document.querySelector("#isRainbow").checked = result.isRainbow;
    document.querySelector("#rainbow_size").value = result.rainbow_size;
    document.querySelector("#opacity").value = result.opacity;
    document.querySelector("#place").value = result.place;
    document.querySelector("#smooth").value = result.smooth;
    document.querySelector("#showCounter").checked = result.showCounter;
    document.querySelector("#showStatusBar").checked = result.showStatusBar;
    document.querySelector("#statusBarMode").value = result.statusBarMode;
    document.querySelector("#showThirdPartyOnly").checked = result.showThirdPartyOnly;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  chrome.storage.local.get({
      color: "#FF0000",
      isRainbow: true,
      rainbow_size: 3,
      width: "2",
      opacity: "0.75",
      place: "top",
      smooth: "no",
      showCounter: true,
      showStatusBar: true,
      statusBarMode: "fixed",
      showThirdPartyOnly: false
  }).then(updateSettings, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
// Save when form is submitted (Save button clicked)
document.querySelector("form").addEventListener("submit", saveOptions);
// Also save on any individual change for real-time updates
document.querySelectorAll("select").forEach((i) => i.addEventListener("change", saveOptions));
document.querySelectorAll("input").forEach((i) => i.addEventListener("change", saveOptions));