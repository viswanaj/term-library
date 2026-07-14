// popup.js — drives the extension popup UI

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function loadLibrary() {
  const { highlights = [] } = await chrome.storage.local.get("highlights");
  const container = document.getElementById("library-content");

  if (highlights.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📚</div>
        Highlight any text on a webpage,<br>right-click, and choose<br><strong>"Add to Term Library"</strong>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="term-count">${highlights.length} highlight${highlights.length !== 1 ? "s" : ""} saved</div>
    <div class="term-list">
      ${highlights.map(h => `
        <div class="term-card" data-id="${escapeHtml(h.id)}">
          <button class="delete-btn" data-id="${escapeHtml(h.id)}" title="Remove">✕</button>
          <p class="text">${escapeHtml(h.text)}</p>
          <a class="source-link" href="${escapeHtml(h.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(h.title || h.url)}</a>
          <div class="term-date">${formatDate(h.addedAt)}</div>
        </div>
      `).join("")}
    </div>`;

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await deleteHighlight(btn.dataset.id);
      loadLibrary();
    });
  });
}

async function deleteHighlight(id) {
  const { highlights = [] } = await chrome.storage.local.get("highlights");
  await chrome.storage.local.set({ highlights: highlights.filter(h => h.id !== id) });
}

loadLibrary();
