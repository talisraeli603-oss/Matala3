/**
 * Correct solutions live on the server only.
 * Client code receives public fields (title, briefing) and never these answers.
 */
const stages = [
  {
    id: 1,
    title: "Open the catalog",
    briefing:
      "A visitor walks in and asks to see every book in the library. Send a request that retrieves the full books collection.",
    hint: "Collections are listed with GET on the resource path, with no id.",
    expected: {
      method: "GET",
      path: "/api/books",
      query: {},
    },
  },
  {
    id: 2,
    title: "Find one title",
    briefing:
      "Someone asks specifically for the book whose id is 3 (HTTP Illustrated). Retrieve that single book using a route parameter.",
    hint: "A single resource lives at /api/books/:id.",
    expected: {
      method: "GET",
      path: "/api/books/3",
      query: {},
    },
  },
  {
    id: 3,
    title: "Filter by genre",
    briefing:
      "The sci-fi club wants only books in the sci-fi genre. Use a query parameter so the server actually filters the list.",
    hint: "Query parameters start after ? — for example genre=...",
    expected: {
      method: "GET",
      path: "/api/books",
      query: { genre: "sci-fi" },
    },
  },
  {
    id: 4,
    title: "Filter and sort",
    briefing:
      "Now the club wants sci-fi books sorted by year (oldest first). You must send two query parameters: genre=sci-fi and sort=year. Both must change what the server returns.",
    hint: "Combine query pairs with &.",
    expected: {
      method: "GET",
      path: "/api/books",
      query: { genre: "sci-fi", sort: "year" },
    },
  },
  {
    id: 5,
    title: "Acquire a new book",
    briefing:
      "Add a new book to the catalog. Send a JSON body with exactly these fields and values: title \"REST in Practice\", author \"Jim Webber\", genre \"tech\", year 2010, copies 2.",
    hint: "Creating a resource uses POST on the collection, with a JSON body.",
    expected: {
      method: "POST",
      path: "/api/books",
      query: {},
      body: {
        title: "REST in Practice",
        author: "Jim Webber",
        genre: "tech",
        year: 2010,
        copies: 2,
      },
    },
  },
  {
    id: 6,
    title: "Update copies",
    briefing:
      "Book 2 (Bread and Rain) received a shipment. Partially update it: set copies to 5. Use a route parameter for the id and a JSON body for the field you change.",
    hint: "PATCH updates part of a resource. PUT would replace it.",
    expected: {
      method: "PATCH",
      path: "/api/books/2",
      query: {},
      body: { copies: 5 },
    },
  },
  {
    id: 7,
    title: "Reviews of a book",
    briefing:
      "Show every review written about book 1. Use the relationship between the two resources (books and reviews).",
    hint: "Nested routes often look like /api/books/:id/reviews.",
    expected: {
      method: "GET",
      path: "/api/books/1/reviews",
      query: {},
    },
  },
  {
    id: 8,
    title: "Only the five-star notes",
    briefing:
      "From the reviews of book 1, keep only those with rating 5 or higher. Combine a route parameter with a query parameter: minRating=5.",
    hint: "Same nested path as before, plus a query string.",
    expected: {
      method: "GET",
      path: "/api/books/1/reviews",
      query: { minRating: "5" },
    },
  },
  {
    id: 9,
    title: "Leave a review",
    briefing:
      "Publish a new review for book 3. POST a JSON body with bookId 3, reviewer \"Amit\", rating 4, and comment \"Clear and practical\".",
    hint: "Reviews are their own collection: POST /api/reviews.",
    expected: {
      method: "POST",
      path: "/api/reviews",
      query: {},
      body: {
        bookId: 3,
        reviewer: "Amit",
        rating: 4,
        comment: "Clear and practical",
      },
    },
  },
  {
    id: 10,
    title: "Withdraw a title",
    briefing:
      "Book 4 (Red Dunes) is leaving the collection. Delete that book.",
    hint: "DELETE on the specific resource path.",
    expected: {
      method: "DELETE",
      path: "/api/books/4",
      query: {},
    },
  },
  {
    id: 11,
    title: "A missing shelf",
    briefing:
      "A patron asks for book id 99, which does not exist. Send the correct GET request anyway, then read the status code and error body. The server should answer with 404 — examining that error is the point of this stage.",
    hint: "Not every valid-looking URL points at a real resource. Look at the status code.",
    expected: {
      method: "GET",
      path: "/api/books/99",
      query: {},
    },
  },
];

function publicStages() {
  return stages.map(({ id, title, briefing, hint }) => ({
    id,
    title,
    briefing,
    hint,
  }));
}

function getStage(id) {
  return stages.find((stage) => stage.id === Number(id)) || null;
}

module.exports = {
  stages,
  publicStages,
  getStage,
  totalStages: stages.length,
};
