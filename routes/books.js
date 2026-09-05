const express = require("express");
const { db, nextId } = require("../data/store");
const { sendApi, parsePositiveInt } = require("../lib/http");

const router = express.Router();

function applyBookFilters(books, query) {
  let result = books.slice();

  if (query.genre) {
    const genre = String(query.genre).toLowerCase();
    result = result.filter((book) => book.genre.toLowerCase() === genre);
  }

  if (query.author) {
    const author = String(query.author).toLowerCase();
    result = result.filter((book) => book.author.toLowerCase() === author);
  }

  if (query.available !== undefined) {
    const flag = String(query.available).toLowerCase();
    if (flag === "true" || flag === "false") {
      const wanted = flag === "true";
      result = result.filter((book) => book.available === wanted);
    }
  }

  if (query.sort === "year") {
    result.sort((a, b) => a.year - b.year);
  } else if (query.sort === "-year") {
    result.sort((a, b) => b.year - a.year);
  } else if (query.sort === "title") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
}

function normalizeBookInput(body, { partial }) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Body must be a JSON object." };
  }

  const out = {};

  if (body.title !== undefined || !partial) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { error: "Field title must be a non-empty string." };
    }
    out.title = body.title.trim();
  }

  if (body.author !== undefined || !partial) {
    if (typeof body.author !== "string" || !body.author.trim()) {
      return { error: "Field author must be a non-empty string." };
    }
    out.author = body.author.trim();
  }

  if (body.genre !== undefined || !partial) {
    if (typeof body.genre !== "string" || !body.genre.trim()) {
      return { error: "Field genre must be a non-empty string." };
    }
    out.genre = body.genre.trim().toLowerCase();
  }

  if (body.year !== undefined || !partial) {
    const year = Number(body.year);
    if (!Number.isInteger(year) || year < 1000 || year > 3000) {
      return { error: "Field year must be an integer year." };
    }
    out.year = year;
  }

  if (body.copies !== undefined || !partial) {
    const copies = Number(body.copies);
    if (!Number.isInteger(copies) || copies < 0) {
      return { error: "Field copies must be a non-negative integer." };
    }
    out.copies = copies;
    out.available = copies > 0;
  } else if (body.available !== undefined) {
    out.available = Boolean(body.available);
  }

  return { value: out };
}

router.get("/", (req, res) => {
  const books = applyBookFilters(db.books, req.query);
  return sendApi(req, res, 200, books);
});

router.get("/:id/reviews", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Book id must be a positive integer." });
  }
  const book = db.books.find((item) => item.id === id);
  if (!book) {
    return sendApi(req, res, 404, { error: `Book ${id} was not found.` });
  }

  let reviews = db.reviews.filter((review) => review.bookId === id);
  if (req.query.minRating !== undefined) {
    const min = Number(req.query.minRating);
    if (!Number.isFinite(min)) {
      return sendApi(req, res, 400, { error: "minRating must be a number." });
    }
    reviews = reviews.filter((review) => review.rating >= min);
  }

  return sendApi(req, res, 200, reviews);
});

router.get("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Book id must be a positive integer." });
  }
  const book = db.books.find((item) => item.id === id);
  if (!book) {
    return sendApi(req, res, 404, { error: `Book ${id} was not found.` });
  }
  return sendApi(req, res, 200, book);
});

router.post("/", (req, res) => {
  const parsed = normalizeBookInput(req.body, { partial: false });
  if (parsed.error) {
    return sendApi(req, res, 400, { error: parsed.error });
  }
  const book = {
    id: nextId(db.books),
    ...parsed.value,
  };
  if (book.available === undefined) {
    book.available = book.copies > 0;
  }
  db.books.push(book);
  return sendApi(req, res, 201, book);
});

router.put("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Book id must be a positive integer." });
  }
  const index = db.books.findIndex((item) => item.id === id);
  if (index === -1) {
    return sendApi(req, res, 404, { error: `Book ${id} was not found.` });
  }
  const parsed = normalizeBookInput(req.body, { partial: false });
  if (parsed.error) {
    return sendApi(req, res, 400, { error: parsed.error });
  }
  const book = {
    id,
    ...parsed.value,
  };
  if (book.available === undefined) {
    book.available = book.copies > 0;
  }
  db.books[index] = book;
  return sendApi(req, res, 200, book);
});

router.patch("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Book id must be a positive integer." });
  }
  const book = db.books.find((item) => item.id === id);
  if (!book) {
    return sendApi(req, res, 404, { error: `Book ${id} was not found.` });
  }
  const parsed = normalizeBookInput(req.body, { partial: true });
  if (parsed.error) {
    return sendApi(req, res, 400, { error: parsed.error });
  }
  if (!parsed.value || Object.keys(parsed.value).length === 0) {
    return sendApi(req, res, 400, { error: "PATCH body must include at least one field." });
  }
  Object.assign(book, parsed.value);
  if (book.copies !== undefined) {
    book.available = book.copies > 0;
  }
  return sendApi(req, res, 200, book);
});

router.delete("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Book id must be a positive integer." });
  }
  const index = db.books.findIndex((item) => item.id === id);
  if (index === -1) {
    return sendApi(req, res, 404, { error: `Book ${id} was not found.` });
  }
  const [removed] = db.books.splice(index, 1);
  db.reviews = db.reviews.filter((review) => review.bookId !== id);
  return sendApi(req, res, 200, { deleted: true, book: removed });
});

module.exports = router;
