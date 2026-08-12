const queryInput = document.getElementById("query");
const searchBtn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const profileEl = document.getElementById("profile");
const resultsEl = document.getElementById("results");
const disclaimerEl = document.getElementById("disclaimer");

function statusChipClass(status) {
  if (status === "STRONG_MATCH") return "success";
  if (status === "POTENTIAL_MISMATCH") return "danger";
  return "warning";
}

function renderProfile(profile) {
  if (!profile) {
    profileEl.classList.add("hidden");
    return;
  }

  profileEl.classList.remove("hidden");
  profileEl.innerHTML = `
    <strong>Extracted profile</strong>
    <div>Age: ${profile.age ?? "Unknown"} | Sex: ${profile.sex ?? "Unknown"} | Location: ${profile.location ?? "Unknown"}</div>
    <div>Conditions: ${(profile.conditions || []).join(", ") || "None"}</div>
    <div>Lab values: ${Object.entries(profile.lab_values || {}).map(([k, v]) => `${k} ${v}`).join(", ") || "None"}</div>
  `;
}

function renderTrials(trials) {
  if (!trials.length) {
    resultsEl.innerHTML = `<div class="empty">No recruiting trials matched this query.</div>`;
    return;
  }

  resultsEl.innerHTML = trials.map((trial) => `
    <article class="trial-card">
      <h2>${trial.title || "Untitled trial"}</h2>
      <div class="meta">
        <span class="chip">${trial.nct_id || "NCT pending"}</span>
        <span class="chip">${trial.matched_condition || "Condition match"}</span>
        <span class="chip ${statusChipClass(trial.eligibility_status)}">${trial.eligibility_status || "UNCERTAIN"}</span>
        <span class="chip">Score ${trial.score ?? trial.ranking_score ?? "—"}</span>
      </div>
      <p>${trial.eligibility_explanation || trial.eligibility_summary || "Eligibility details unavailable."}</p>
      ${trial.match_reasons?.length ? `<div class="section-title">Why this trial matched</div><ul>${trial.match_reasons.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
      ${trial.potential_conflicts?.length ? `<div class="section-title">Potential conflicts</div><ul>${trial.potential_conflicts.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
    </article>
  `).join("");
}

async function searchTrials() {
  const query = queryInput.value.trim();

  if (!query) {
    statusEl.textContent = "Please enter a search query.";
    statusEl.classList.remove("hidden");
    return;
  }

  searchBtn.disabled = true;
  statusEl.classList.remove("hidden");
  statusEl.textContent = "Searching trials...";
  disclaimerEl.classList.add("hidden");

  try {
    const response = await fetch("/search-trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Search failed");
    }

    statusEl.textContent = `Found ${data.trials?.length || 0} trial(s).`;
    renderProfile(data.patient_profile);
    renderTrials(data.trials || []);
    disclaimerEl.textContent = data.disclaimer || "";
    disclaimerEl.classList.remove("hidden");
  } catch (error) {
    statusEl.textContent = error.message;
    resultsEl.innerHTML = "";
    profileEl.classList.add("hidden");
  } finally {
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener("click", searchTrials);

queryInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    searchTrials();
  }
});
