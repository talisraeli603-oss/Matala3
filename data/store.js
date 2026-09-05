const fs = require("fs");
const path = require("path");

const seedPath = path.join(__dirname, "seed.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadSeed() {
  return JSON.parse(fs.readFileSync(seedPath, "utf8"));
}

const db = {
  books: [],
  reviews: [],
};

function reset() {
  const seed = loadSeed();
  db.books = clone(seed.books);
  db.reviews = clone(seed.reviews);
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

reset();

module.exports = {
  db,
  reset,
  nextId,
};
