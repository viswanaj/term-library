// Content script - runs on every page
// Shows toast notifications when terms are added

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "NOTIFY") {
    showToast(msg.message);
  }
});

function showToast(message) {
  // Remove existing toast if any
  const existing = document.getElementById("term-library-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "term-library-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1a1a2e;
    color: #e0e0ff;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    border-left: 3px solid #7c6af7;
    max-width: 320px;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
