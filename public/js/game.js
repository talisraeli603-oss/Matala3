(function () {
  const STORAGE_KEY = "catalog-quest-progress";

  const els = {
    stageList: document.getElementById("stage-list"),
    stageCounter: document.getElementById("stage-counter"),
    stageTitle: document.getElementById("stage-title"),
    stageBriefing: document.getElementById("stage-briefing"),
    stageHint: document.getElementById("stage-hint"),
    toggleHint: document.getElementById("toggle-hint"),
    method: document.getElementById("method"),
    path: document.getElementById("path"),
    queryRows: document.getElementById("query-rows"),
    addQuery: document.getElementById("add-query"),
    body: document.getElementById("body"),
    preview: document.getElementById("request-preview"),
    form: document.getElementById("request-form"),
    nextStage: document.getElementById("next-stage"),
    statusPill: document.getElementById("status-pill"),
    responsePanel: document.getElementById("response-panel"),
    responseNote: document.getElementById("response-note"),
    feedback: document.getElementById("game-feedback"),
    responseBody: document.getElementById("response-body"),
    scoreValue: document.getElementById("score-value"),
    attemptValue: document.getElementById("attempt-value"),
    resetProgress: document.getElementById("reset-progress"),
  };

  let stages = [];
  let total = 0;
  let currentId = 1;
  let progress = loadProgress();

  // Last response per stage, kept for this session so revisiting a stage shows what it answered.
  const stageResponses = {};

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return defaultProgress();
      }
      const parsed = JSON.parse(raw);
      return {
        currentId: parsed.currentId || 1,
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        attempts: parsed.attempts || {},
        awarded: parsed.awarded || {},
        score: Number(parsed.score) || 0,
      };
    } catch (err) {
      return defaultProgress();
    }
  }

  function defaultProgress() {
    return {
      currentId: 1,
      completed: [],
      attempts: {},
      awarded: {},
      score: 0,
    };
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function currentStage() {
    return stages.find((stage) => stage.id === currentId) || stages[0];
  }

  function maxUnlockedId() {
    if (progress.completed.length === 0) {
      return 1;
    }
    return Math.min(total, Math.max.apply(null, progress.completed) + 1);
  }

  function canOpen(id) {
    return id <= maxUnlockedId() || progress.completed.indexOf(id) !== -1;
  }

  function addQueryRow(key, value) {
    const row = document.createElement("div");
    row.className = "kv-row";
    row.innerHTML =
      '<input class="q-key" type="text" placeholder="name" spellcheck="false" />' +
      '<input class="q-val" type="text" placeholder="value" spellcheck="false" />' +
      '<button type="button" class="btn btn-small q-remove">Remove</button>';
    row.querySelector(".q-key").value = key || "";
    row.querySelector(".q-val").value = value || "";
    row.querySelector(".q-remove").addEventListener("click", function () {
      row.remove();
      updatePreview();
    });
    row.querySelector(".q-key").addEventListener("input", updatePreview);
    row.querySelector(".q-val").addEventListener("input", updatePreview);
    els.queryRows.appendChild(row);
  }

  function collectQuery() {
    const params = new URLSearchParams();
    els.queryRows.querySelectorAll(".kv-row").forEach(function (row) {
      const key = row.querySelector(".q-key").value.trim();
      const value = row.querySelector(".q-val").value;
      if (key) {
        params.append(key, value);
      }
    });
    return params;
  }

  function normalizePath(value) {
    let path = (value || "").trim();
    if (!path) {
      return "/";
    }
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    return path;
  }

  function updatePreview() {
    const method = els.method.value;
    const path = normalizePath(els.path.value);
    const query = collectQuery().toString();
    const url = query ? path + "?" + query : path;
    const bodyText = els.body.value.trim();
    let preview = method + " " + url + "\nX-Game-Stage: " + currentId;
    if (bodyText && method !== "GET") {
      preview += "\nContent-Type: application/json\n\n" + bodyText;
    }
    els.preview.textContent = preview;
  }

  function renderStageList() {
    els.stageList.innerHTML = "";
    stages.forEach(function (stage) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = stage.id + ". " + stage.title;
      const done = progress.completed.indexOf(stage.id) !== -1;
      if (done) {
        button.classList.add("is-done");
      }
      if (stage.id === currentId) {
        button.classList.add("is-current");
      }
      button.disabled = !canOpen(stage.id);
      button.addEventListener("click", function () {
        if (!canOpen(stage.id)) {
          return;
        }
        showStage(stage.id);
      });
      item.appendChild(button);
      els.stageList.appendChild(item);
    });
  }

  function showStage(id) {
    currentId = id;
    progress.currentId = id;
    saveProgress();
    const stage = currentStage();
    els.stageCounter.textContent = "Stage " + stage.id + " of " + total;
    els.stageTitle.textContent = stage.title;
    els.stageBriefing.textContent = stage.briefing;
    els.stageHint.textContent = stage.hint;
    els.stageHint.hidden = true;
    els.toggleHint.textContent = "Show hint";
    els.nextStage.hidden = progress.completed.indexOf(stage.id) === -1;
    els.attemptValue.textContent = String(progress.attempts[String(stage.id)] || 0);
    els.scoreValue.textContent = String(progress.score);

    const saved = stageResponses[String(stage.id)];
    if (saved) {
      renderResponse(saved, true);
    } else {
      hideResponse();
    }

    renderStageList();
    updatePreview();
  }

  function hideResponse() {
    els.responsePanel.hidden = true;
    els.responseNote.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.statusPill.textContent = "waiting";
    els.statusPill.className = "status-pill";
    els.responseBody.textContent = "";
  }

  function renderResponse(snapshot, isRestored) {
    els.responsePanel.hidden = false;
    els.responseNote.hidden = !isRestored;
    els.statusPill.textContent = snapshot.pillText;
    els.statusPill.className = snapshot.pillClass;
    els.feedback.textContent = snapshot.feedbackText;
    els.feedback.className = snapshot.feedbackClass;
    els.responseBody.textContent = snapshot.bodyText;
  }

  function rememberResponse() {
    stageResponses[String(currentId)] = {
      pillText: els.statusPill.textContent,
      pillClass: els.statusPill.className,
      feedbackText: els.feedback.textContent,
      feedbackClass: els.feedback.className,
      bodyText: els.responseBody.textContent,
    };
  }

  function pointsForAttempts(attempts) {
    if (attempts <= 1) {
      return 100;
    }
    if (attempts === 2) {
      return 70;
    }
    if (attempts === 3) {
      return 40;
    }
    return 20;
  }

  function setStatusPill(status) {
    els.statusPill.textContent = String(status);
    els.statusPill.className = "status-pill";
    if (status >= 200 && status < 300) {
      els.statusPill.classList.add("is-ok");
    } else if (status >= 400) {
      els.statusPill.classList.add("is-err");
    } else {
      els.statusPill.classList.add("is-warn");
    }
  }

  async function sendRequest(event) {
    event.preventDefault();
    const method = els.method.value;
    const path = normalizePath(els.path.value);
    const query = collectQuery().toString();
    const url = query ? path + "?" + query : path;
    const headers = {
      "X-Game-Stage": String(currentId),
    };
    const init = { method: method, headers: headers };

    if (method !== "GET" && method !== "HEAD") {
      const raw = els.body.value.trim();
      if (raw) {
        headers["Content-Type"] = "application/json";
        init.body = raw;
      }
    }

    els.responsePanel.hidden = false;
    els.responseNote.hidden = true;
    els.statusPill.textContent = "sending";
    els.statusPill.className = "status-pill";
    els.feedback.textContent = "Sending…";
    els.feedback.className = "feedback";
    els.responseBody.textContent = "Waiting for the server…";

    let response;
    let parsed;
    try {
      response = await fetch(url, init);
      const text = await response.text();
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (err) {
        parsed = { parseError: "Response was not JSON", raw: text };
      }
    } catch (err) {
      els.statusPill.textContent = "network";
      els.statusPill.className = "status-pill is-err";
      els.feedback.textContent = "Could not reach the server. Is it running?";
      els.feedback.classList.add("is-err");
      els.responseBody.textContent = String(err);
      rememberResponse();
      return;
    }

    setStatusPill(response.status);
    const pretty = JSON.stringify(parsed, null, 2);
    els.responseBody.textContent = "HTTP " + response.status + " " + response.statusText + "\n\n" + pretty;

    const key = String(currentId);
    progress.attempts[key] = (progress.attempts[key] || 0) + 1;
    els.attemptValue.textContent = String(progress.attempts[key]);

    const game = parsed && parsed.game;
    const correct = Boolean(game && game.correct);

    if (correct) {
      els.feedback.textContent = game.message || "Correct.";
      els.feedback.className = "feedback is-ok";
      if (progress.completed.indexOf(currentId) === -1) {
        progress.completed.push(currentId);
      }
      if (!progress.awarded[key]) {
        const gained = pointsForAttempts(progress.attempts[key]);
        progress.score += gained;
        progress.awarded[key] = gained;
        els.feedback.textContent += " +" + gained + " points.";
      }
      els.scoreValue.textContent = String(progress.score);
      els.nextStage.hidden = currentId >= total;
      if (currentId >= total) {
        els.nextStage.hidden = true;
        els.feedback.textContent += " You finished every stage.";
      }
    } else {
      const extra = game && Array.isArray(game.details) && game.details.length
        ? " " + game.details.join(" ")
        : "";
      els.feedback.textContent = (game && game.message ? game.message : "The server did not accept this as the stage solution.") + extra;
      els.feedback.className = "feedback is-err";
      els.nextStage.hidden = progress.completed.indexOf(currentId) === -1;
    }

    rememberResponse();
    saveProgress();
    renderStageList();
  }

  async function resetAll() {
    progress = defaultProgress();
    saveProgress();
    Object.keys(stageResponses).forEach(function (key) {
      delete stageResponses[key];
    });
    try {
      await fetch("/api/game/reset", { method: "POST" });
    } catch (err) {
      /* catalog reset is best-effort; local progress still clears */
    }
    els.method.value = "GET";
    els.path.value = "/api/books";
    els.body.value = "";
    els.queryRows.innerHTML = "";
    addQueryRow("", "");
    showStage(1);
  }

  els.method.addEventListener("change", updatePreview);
  els.path.addEventListener("input", updatePreview);
  els.body.addEventListener("input", updatePreview);
  els.addQuery.addEventListener("click", function () {
    addQueryRow("", "");
    updatePreview();
  });
  els.form.addEventListener("submit", sendRequest);
  els.nextStage.addEventListener("click", function () {
    if (currentId < total) {
      showStage(currentId + 1);
    }
  });
  els.toggleHint.addEventListener("click", function () {
    els.stageHint.hidden = !els.stageHint.hidden;
    els.toggleHint.textContent = els.stageHint.hidden ? "Show hint" : "Hide hint";
  });
  els.resetProgress.addEventListener("click", resetAll);

  addQueryRow("", "");

  fetch("/api/game/stages")
    .then(function (res) {
      return res.json();
    })
    .then(function (payload) {
      total = payload.total;
      stages = payload.stages;
      const startId = canOpen(progress.currentId) ? progress.currentId : 1;
      showStage(startId);
    })
    .catch(function () {
      els.stageTitle.textContent = "Could not load stages";
      els.stageBriefing.textContent = "The public stage list comes from GET /api/game/stages. Start the server and refresh.";
    });
})();
