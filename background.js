// Background service worker
// Handles context menu creation and Claude API calls

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToLibrary",
    title: "Add \"%s\" to Term Library",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToLibrary") {
    const term = info.selectionText.trim();

    // Get user's specialization from storage
    const { specialization, apiKey } = await chrome.storage.local.get([
      "specialization",
      "apiKey"
    ]);

    if (!apiKey) {
      // Notify user to set API key
      chrome.tabs.sendMessage(tab.id, {
        type: "NOTIFY",
        message: "Please set your Claude API key in the Term Library extension popup."
      });
      return;
    }

    if (!specialization) {
      chrome.tabs.sendMessage(tab.id, {
        type: "NOTIFY",
        message: "Please set your field/specialization in the Term Library extension popup."
      });
      return;
    }

    // Notify content script that we're loading
    chrome.tabs.sendMessage(tab.id, {
      type: "NOTIFY",
      message: `Looking up "${term}"...`
    });

    try {
      const entry = await fetchTermEntry(term, specialization, apiKey);
      await saveTermToLibrary(term, entry);

      chrome.tabs.sendMessage(tab.id, {
        type: "NOTIFY",
        message: `"${term}" added to your library!`
      });
    } catch (err) {
      chrome.tabs.sendMessage(tab.id, {
        type: "NOTIFY",
        message: `Error: ${err.message}`
      });
    }
  }
});

// Call Claude API to get a field-relevant explanation
async function fetchTermEntry(term, specialization, apiKey) {
  const prompt = `You are a scientific knowledge assistant. A researcher specializing in "${specialization}" has encountered the term "${term}" and wants to understand it as it applies to their field.

Please provide a structured response in the following JSON format (respond ONLY with valid JSON, no markdown, no backticks):
{
  "definition": "A clear, concise definition of the term (2-3 sentences)",
  "relevance": "How this term is specifically relevant to ${specialization} (3-4 sentences)",
  "key_concepts": ["concept 1", "concept 2", "concept 3"],
  "relevant_studies": [
    {
      "title": "Study title or description",
      "finding": "Key finding relevant to the researcher's field"
    }
  ],
  "open_questions": "What is still unknown or debated about this topic as it relates to ${specialization} (2-3 sentences)"
}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "API request failed");
  }

  const data = await response.json();
  const text = data.content[0].text;

  try {
    return JSON.parse(text);
  } catch {
    // Fallback if JSON parsing fails
    return {
      definition: text,
      relevance: "",
      key_concepts: [],
      relevant_studies: [],
      open_questions: ""
    };
  }
}

// Save term entry to Chrome local storage
async function saveTermToLibrary(term, entry) {
  const { library = {} } = await chrome.storage.local.get("library");
  library[term] = {
    ...entry,
    term,
    addedAt: new Date().toISOString()
  };
  await chrome.storage.local.set({ library });
}
