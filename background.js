// Background service worker
// Handles context menu creation and saving highlights to the library

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToLibrary",
    title: "Add \"%s\" to Term Library",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "addToLibrary") return;

  const text = info.selectionText.trim();
  if (!text) return;

  const url = buildTextFragmentUrl(info.pageUrl, text);
  await saveHighlight(text, url, tab?.title || info.pageUrl);

  chrome.tabs.sendMessage(tab.id, {
    type: "NOTIFY",
    message: `Added "${text}" to your library`
  });
});

// Builds a URL with a "text fragment" (#:~:text=...) so the link scrolls to
// and highlights the exact selected text in browsers that support it
// (Chrome, Edge). Unsupported browsers just land on the page normally.
function buildTextFragmentUrl(pageUrl, text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const encode = (s) => encodeURIComponent(s).replace(/-/g, "%2D");

  const words = clean.split(" ");
  let fragment;
  if (words.length > 16) {
    // Long selections are more reliably matched as a start...end range
    // rather than one huge exact-match string.
    const start = words.slice(0, 8).join(" ");
    const end = words.slice(-8).join(" ");
    fragment = `${encode(start)},${encode(end)}`;
  } else {
    fragment = encode(clean);
  }

  const base = pageUrl.split("#")[0];
  return `${base}#:~:text=${fragment}`;
}

async function saveHighlight(text, url, title) {
  const { highlights = [] } = await chrome.storage.local.get("highlights");
  highlights.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    url,
    title,
    addedAt: new Date().toISOString()
  });
  await chrome.storage.local.set({ highlights });
}
