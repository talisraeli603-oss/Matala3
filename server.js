const path = require("path");
const express = require("express");
const { validateStageRequest } = require("./game/validate");
const { publicStages, totalStages } = require("./game/stages");
const { sendApi } = require("./lib/http");
const booksRouter = require("./routes/books");
const reviewsRouter = require("./routes/reviews");
const gameRouter = require("./routes/game");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api") && req.get("X-Game-Stage")) {
    req.gameResult = validateStageRequest(req);
  }
  next();
});

app.get("/", (req, res) => {
  res.render("game", {
    pageTitle: "Catalog Quest — HTTP & REST",
    totalStages,
  });
});

app.get("/schemas", (req, res) => {
  const schemas = [
    {
      name: "books",
      description: "Titles held in the Lumen Library catalog.",
      collectionPath: "/api/books",
      itemPath: "/api/books/:id",
      nestedPath: "/api/books/:id/reviews",
      fields: [
        { name: "id", type: "integer", notes: "Server-generated unique id" },
        { name: "title", type: "string", notes: "Book title" },
        { name: "author", type: "string", notes: "Author display name" },
        { name: "genre", type: "string", notes: "e.g. sci-fi, fiction, tech" },
        { name: "year", type: "integer", notes: "Year of publication" },
        { name: "available", type: "boolean", notes: "true when copies > 0" },
        { name: "copies", type: "integer", notes: "Copies currently on the shelf" },
      ],
    },
    {
      name: "reviews",
      description: "Reader notes attached to a book.",
      collectionPath: "/api/reviews",
      itemPath: "/api/reviews/:id",
      nestedPath: "/api/books/:id/reviews",
      fields: [
        { name: "id", type: "integer", notes: "Server-generated unique id" },
        { name: "bookId", type: "integer", notes: "Foreign key to books.id" },
        { name: "reviewer", type: "string", notes: "Display name of the reader" },
        { name: "rating", type: "integer", notes: "Integer from 1 to 5" },
        { name: "comment", type: "string", notes: "Free-text impression" },
      ],
    },
  ];

  res.render("schemas", {
    pageTitle: "Resource schemas — Catalog Quest",
    schemas,
    stagesCount: publicStages().length,
  });
});

app.use("/api/game", gameRouter);
app.use("/api/books", booksRouter);
app.use("/api/reviews", reviewsRouter);

app.use("/api", (req, res) => {
  return sendApi(req, res, 404, {
    error: "No such API resource.",
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((req, res) => {
  res.status(404).type("text").send("Not found");
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendApi(req, res, 400, { error: "Malformed JSON body." });
  }
  console.error(err);
  return sendApi(req, res, 500, { error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Catalog Quest listening on http://localhost:${PORT}`);
});
