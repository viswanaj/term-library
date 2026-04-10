// popup.js — drives the extension popup UI

// --- Tab switching ---
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-panel`).classList.add("active");
    hideDetail();
  });
});

// --- Settings ---
async function loadSettings() {
  const { specialization, apiKey } = await chrome.storage.local.get(["specialization", "apiKey"]);
  if (specialization) document.getElementById("specialization").value = specialization;
  if (apiKey) document.getElementById("api-key").value = apiKey;
}

document.getElementById("save-settings").addEventListener("click", async () => {
  const specialization = document.getElementById("specialization").value.trim();
  const apiKey = document.getElementById("api-key").value.trim();
  await chrome.storage.local.set({ specialization, apiKey });
  const msg = document.getElementById("saved-msg");
  msg.textContent = "✓ Settings saved";
  setTimeout(() => msg.textContent = "", 2000);
});

// --- Library ---
async function loadLibrary() {
  const { library = {} } = await chrome.storage.local.get("library");
  const container = document.getElementById("library-content");
  const terms = Object.values(library).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  if (terms.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📚</div>
        Highlight any term on a webpage,<br>right-click, and choose<br><strong>"Add to Term Library"</strong>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="term-count">${terms.length} term${terms.length !== 1 ? "s" : ""} saved</div>
    <div class="term-list">
      ${terms.map(t => `
        <div class="term-card" data-term="${encodeURIComponent(t.term)}">
          <h3>${t.term}</h3>
          <p>${t.definition || ""}</p>
          <div class="term-date">${formatDate(t.addedAt)}</div>
        </div>
      `).join("")}
    </div>`;

  document.querySelectorAll(".term-card").forEach(card => {
    card.addEventListener("click", () => {
      const term = decodeURIComponent(card.dataset.term);
      showDetail(library[term]);
    });
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// --- Detail View ---
function showDetail(entry) {
  document.getElementById("library-panel").style.display = "none";
  const detail = document.getElementById("detail-panel");
  detail.classList.add("active");

  const studiesHTML = (entry.relevant_studies || []).map(s => `
    <div class="study-item">
      <div class="study-title">${s.title}</div>
      <div class="study-finding">${s.finding}</div>
    </div>
  `).join("") || '<div class="detail-text" style="color:#555">None listed</div>';

  const conceptsHTML = (entry.key_concepts || []).map(c =>
    `<span class="chip">${c}</span>`
  ).join("") || "";

  document.getElementById("detail-content").innerHTML = `
    <div class="detail-term">${entry.term}</div>

    <div class="section-label">Definition</div>
    <div class="detail-text">${entry.definition || "—"}</div>

    <div class="section-label">Relevance to Your Field</div>
    <div class="detail-text">${entry.relevance || "—"}</div>

    ${conceptsHTML ? `
      <div class="section-label">Key Concepts</div>
      <div class="chips">${conceptsHTML}</div>
    ` : ""}

    <div class="section-label">Relevant Studies</div>
    ${studiesHTML}

    ${entry.open_questions ? `
      <div class="section-label">Open Questions</div>
      <div class="detail-text">${entry.open_questions}</div>
    ` : ""}
  `;
}

function hideDetail() {
  document.getElementById("library-panel").style.display = "block";
  document.getElementById("detail-panel").classList.remove("active");
}

document.getElementById("back-btn").addEventListener("click", hideDetail);

// --- Init ---
loadSettings();
loadLibrary();
