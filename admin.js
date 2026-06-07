const editor = document.querySelector("#contentEditor");
const statusEl = document.querySelector("#status");
const savedAtEl = document.querySelector("#savedAt");
const saveButton = document.querySelector("#saveButton");
const reloadButton = document.querySelector("#reloadButton");
const submissionsButton = document.querySelector("#loadSubmissionsButton");
const submissionsList = document.querySelector("#submissionsList");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function loadContent() {
  try {
    setStatus("Loading content...");
    const response = await fetch("/api/content", { cache: "no-store" });
    if (!response.ok) throw new Error(`Load failed with status ${response.status}`);
    const content = await response.json();
    editor.value = JSON.stringify(content, null, 2);
    savedAtEl.textContent = "Loaded";
    setStatus("Content loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function saveContent() {
  let parsed;
  try {
    parsed = JSON.parse(editor.value);
  } catch (error) {
    setStatus(`JSON error: ${error.message}`, true);
    return;
  }

  try {
    setStatus("Saving...");
    const response = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Save failed.");
    savedAtEl.textContent = `Saved ${new Date(result.savedAt).toLocaleTimeString()}`;
    setStatus("Saved. Refresh the public site to see changes.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadSubmissions() {
  try {
    submissionsList.textContent = "Loading submissions...";
    const response = await fetch("/api/submissions", { cache: "no-store" });
    if (!response.ok) throw new Error(`Load failed with status ${response.status}`);
    const submissions = await response.json();

    if (!submissions.length) {
      submissionsList.textContent = "No submissions yet.";
      return;
    }

    submissionsList.innerHTML = submissions
      .map((submission) => `
        <article class="submission">
          <strong>${submission.name || "Unnamed lead"}</strong>
          <span>${submission.email || ""} ${submission.phone || ""}</span>
          <p>${submission.message || ""}</p>
          <span>${new Date(submission.createdAt).toLocaleString()}</span>
        </article>
      `)
      .join("");
  } catch (error) {
    submissionsList.textContent = error.message;
  }
}

saveButton.addEventListener("click", saveContent);
reloadButton.addEventListener("click", loadContent);
submissionsButton.addEventListener("click", loadSubmissions);

loadContent();
loadSubmissions();
