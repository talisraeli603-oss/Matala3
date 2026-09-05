const express = require("express");
const { db, nextId } = require("../data/store");
const { sendApi, parsePositiveInt } = require("../lib/http");

const router = express.Router();

function applyReviewFilters(reviews, query) {
  let result = reviews.slice();

  if (query.bookId !== undefined) {
    const bookId = Number(query.bookId);
    if (!Number.isInteger(bookId)) {
      return { error: "bookId must be an integer." };
    }
    result = result.filter((review) => review.bookId === bookId);
  }

  if (query.minRating !== undefined) {
    const min = Number(query.minRating);
    if (!Number.isFinite(min)) {
      return { error: "minRating must be a number." };
    }
    result = result.filter((review) => review.rating >= min);
  }

  if (query.reviewer) {
    const name = String(query.reviewer).toLowerCase();
    result = result.filter((review) => review.reviewer.toLowerCase() === name);
  }

  return { value: result };
}

router.get("/", (req, res) => {
  const filtered = applyReviewFilters(db.reviews, req.query);
  if (filtered.error) {
    return sendApi(req, res, 400, { error: filtered.error });
  }
  return sendApi(req, res, 200, filtered.value);
});

router.get("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Review id must be a positive integer." });
  }
  const review = db.reviews.find((item) => item.id === id);
  if (!review) {
    return sendApi(req, res, 404, { error: `Review ${id} was not found.` });
  }
  return sendApi(req, res, 200, review);
});

router.post("/", (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return sendApi(req, res, 400, { error: "Body must be a JSON object." });
  }

  const bookId = Number(body.bookId);
  if (!Number.isInteger(bookId) || bookId <= 0) {
    return sendApi(req, res, 400, { error: "Field bookId must be a positive integer." });
  }
  const book = db.books.find((item) => item.id === bookId);
  if (!book) {
    return sendApi(req, res, 404, { error: `Cannot review missing book ${bookId}.` });
  }
  if (typeof body.reviewer !== "string" || !body.reviewer.trim()) {
    return sendApi(req, res, 400, { error: "Field reviewer must be a non-empty string." });
  }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return sendApi(req, res, 400, { error: "Field rating must be an integer from 1 to 5." });
  }
  if (typeof body.comment !== "string" || !body.comment.trim()) {
    return sendApi(req, res, 400, { error: "Field comment must be a non-empty string." });
  }

  const review = {
    id: nextId(db.reviews),
    bookId,
    reviewer: body.reviewer.trim(),
    rating,
    comment: body.comment.trim(),
  };
  db.reviews.push(review);
  return sendApi(req, res, 201, review);
});

router.delete("/:id", (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (!id) {
    return sendApi(req, res, 400, { error: "Review id must be a positive integer." });
  }
  const index = db.reviews.findIndex((item) => item.id === id);
  if (index === -1) {
    return sendApi(req, res, 404, { error: `Review ${id} was not found.` });
  }
  const [removed] = db.reviews.splice(index, 1);
  return sendApi(req, res, 200, { deleted: true, review: removed });
});

module.exports = router;
