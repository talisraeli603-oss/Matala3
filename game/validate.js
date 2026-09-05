const { getStage } = require("./stages");

function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== "string") {
    return "";
  }
  let value = rawPath.trim();
  if (!value.startsWith("/")) {
    value = `/${value}`;
  }
  if (value.length > 1 && value.endsWith("/")) {
    value = value.slice(0, -1);
  }
  return value;
}

function pathnameOf(req) {
  const original = req.originalUrl || req.url || "";
  const q = original.indexOf("?");
  return normalizePath(q === -1 ? original : original.slice(0, q));
}

function valuesEqual(expected, actual) {
  if (typeof expected === "number") {
    return Number(actual) === expected;
  }
  if (typeof expected === "boolean") {
    if (typeof actual === "boolean") {
      return actual === expected;
    }
    return String(actual).toLowerCase() === String(expected);
  }
  return String(actual) === String(expected);
}

function matchQuery(expectedQuery, actualQuery) {
  const expected = expectedQuery || {};
  const actual = actualQuery || {};
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual).filter((key) => actual[key] !== undefined && actual[key] !== "");

  if (expectedKeys.length !== actualKeys.length) {
    return false;
  }

  return expectedKeys.every((key) => valuesEqual(expected[key], actual[key]));
}

function isEmptyBody(body) {
  if (body === undefined || body === null) {
    return true;
  }
  if (typeof body === "object" && !Array.isArray(body)) {
    return Object.keys(body).length === 0;
  }
  return false;
}

function matchBody(expectedBody, actualBody) {
  if (!expectedBody) {
    return isEmptyBody(actualBody);
  }
  if (!actualBody || typeof actualBody !== "object" || Array.isArray(actualBody)) {
    return false;
  }
  const expectedKeys = Object.keys(expectedBody);
  const actualKeys = Object.keys(actualBody);
  if (expectedKeys.length !== actualKeys.length) {
    return false;
  }
  return expectedKeys.every((key) => valuesEqual(expectedBody[key], actualBody[key]));
}

function mismatchHints(stage, req) {
  const hints = [];
  const method = (req.method || "").toUpperCase();
  const path = pathnameOf(req);

  if (method !== stage.expected.method) {
    hints.push("HTTP method does not match this stage.");
  }
  if (path !== normalizePath(stage.expected.path)) {
    hints.push("Request path does not match this stage.");
  }
  if (!matchQuery(stage.expected.query, req.query)) {
    hints.push("Query parameters do not match this stage (names, values, and count).");
  }
  if (!matchBody(stage.expected.body, req.body)) {
    hints.push("Request body does not match this stage.");
  }
  return hints;
}

function validateStageRequest(req) {
  const rawId = req.get("X-Game-Stage");
  if (!rawId) {
    return null;
  }

  const stage = getStage(rawId);
  if (!stage) {
    return {
      correct: false,
      message: "Unknown stage id. Refresh the page and try again.",
      stageId: rawId,
    };
  }

  const methodOk = (req.method || "").toUpperCase() === stage.expected.method;
  const pathOk = pathnameOf(req) === normalizePath(stage.expected.path);
  const queryOk = matchQuery(stage.expected.query, req.query);
  const bodyOk = matchBody(stage.expected.body, req.body);
  const correct = methodOk && pathOk && queryOk && bodyOk;

  if (correct) {
    return {
      correct: true,
      message: "Correct request. The catalog accepts this protocol step.",
      stageId: stage.id,
    };
  }

  return {
    correct: false,
    message: "Not the request this stage needs. Inspect the status and body, then adjust method, path, query, or JSON.",
    details: mismatchHints(stage, req),
    stageId: stage.id,
  };
}

module.exports = {
  validateStageRequest,
  normalizePath,
};
