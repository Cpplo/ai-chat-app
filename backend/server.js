import "dotenv/config";
import cors from "cors";
import express from "express";
import { createClient } from "@supabase/supabase-js";

const {
  PORT = "8000",
  FRONTEND_ORIGIN = "http://127.0.0.1:4173,http://localhost:4173,http://127.0.0.1:5173,http://localhost:5173",
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  GEMINI_API_KEY,
  GEMINI_MODEL = "gemini-2.5-flash",
} = process.env;

const usingServiceRole = Boolean(SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required.");
}

const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
if (!supabaseKey) {
  throw new Error("Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY for the backend.");
}

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required.");
}

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const app = express();

const allowedOrigins = FRONTEND_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  }),
);
app.use(express.json());

function escapeIlike(value) {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

async function getPublicBooks() {
  const { data, error } = await supabase
    .from("books")
    .select(
      "id,title,author,description,category,published_year,publisher,language,isbn,cover_url,source,has_file,download_url,file_format,is_public",
    )
    .eq("is_public", true)
    .limit(100);

  if (error) {
    throw error;
  }

  return data ?? [];
}

const stopWords = new Set([
  "a",
  "about",
  "an",
  "any",
  "are",
  "book",
  "books",
  "can",
  "could",
  "do",
  "for",
  "get",
  "give",
  "have",
  "i",
  "in",
  "is",
  "like",
  "me",
  "of",
  "on",
  "please",
  "recommend",
  "show",
  "suggest",
  "tell",
  "the",
  "to",
  "what",
  "which",
  "with",
  "you",
]);

function extractKeywords(query) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !stopWords.has(term));
}

function scoreBook(book, keywords, query) {
  const haystack = [
    book.title,
    book.author,
    book.category,
    book.description,
    book.publisher,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const keyword of keywords) {
    if (book.title?.toLowerCase().includes(keyword)) score += 5;
    if (book.category?.toLowerCase().includes(keyword)) score += 4;
    if (book.author?.toLowerCase().includes(keyword)) score += 3;
    if (book.description?.toLowerCase().includes(keyword)) score += 2;
    if (book.publisher?.toLowerCase().includes(keyword)) score += 1;
  }

  const loweredQuery = query.toLowerCase();
  const asksForBeginners =
    loweredQuery.includes("beginner") ||
    loweredQuery.includes("beginners") ||
    loweredQuery.includes("start learning") ||
    loweredQuery.includes("introduction");

  if (asksForBeginners) {
    const beginnerSignals = ["introduction", "guide", "fundamentals", "learn", "practical", "modern introduction"];
    for (const signal of beginnerSignals) {
      if (haystack.includes(signal)) {
        score += 3;
      }
    }
  }

  return score;
}

async function searchBooks(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const books = await getPublicBooks();
  const keywords = extractKeywords(trimmed);

  const rankedBooks = books
    .map((book) => ({
      book,
      score: scoreBook(book, keywords, trimmed),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, 8)
    .map(({ book }) => book);

  if (rankedBooks.length > 0) {
    return rankedBooks;
  }

  return books.slice(0, 5);
}

function fallbackBooksPrompt(books) {
  if (books.length === 0) {
    return "No strong catalog matches were found.";
  }

  return books
    .map((book, index) => {
      const details = [
        `Title: ${book.title}`,
        `Author: ${book.author}`,
        `Category: ${book.category ?? "Uncategorized"}`,
        `Year: ${book.published_year ?? "Unknown"}`,
        `Publisher: ${book.publisher ?? "Unknown"}`,
        `Language: ${book.language ?? "Unknown"}`,
        `ISBN: ${book.isbn ?? "N/A"}`,
        `Description: ${book.description ?? "No description available."}`,
        `File available: ${book.has_file ? "Yes" : "No"}`,
      ];

      return `Book ${index + 1}\n${details.join("\n")}`;
    })
    .join("\n\n");
}

function extractText(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => ("text" in part ? part.text : ""))
    .filter(Boolean)
    .join("");

  return text.trim();
}

function buildConversationContext(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No previous conversation context.";
  }

  return history
    .slice(-6)
    .map((message, index) => {
      const role = message?.type === "ai" ? "Assistant" : "User";
      const content =
        typeof message?.content === "string" && message.content.trim().length > 0
          ? message.content.trim()
          : "(empty)";

      return `${index + 1}. ${role}: ${content}`;
    })
    .join("\n");
}

async function generateLibraryAnswer(message, catalogContext, history) {
  const conversationContext = buildConversationContext(history);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are the AI Library Assistant for a real library catalog. " +
                "Your job is to help users discover books that actually exist in the provided catalog context. " +
                "Prefer recommending books from the catalog whenever possible. " +
                "When recommending a book, explain briefly why it fits the user's request. " +
                "Write naturally, warmly, and clearly. Avoid robotic or generic wording. " +
                "Use recent conversation context to understand follow-up questions such as 'what about easier ones' or 'do you have something similar'. " +
                "If the user's question is broad or vague, ask one short follow-up question or make a helpful assumption and say it clearly. " +
                "If the catalog has weak or no direct matches, do not say only 'we do not have this'. " +
                "Instead, say there is no strong direct match, then suggest the closest relevant books from the catalog if any exist. " +
                "Never invent books that are not in the catalog context. " +
                "Keep answers concise but useful, usually 1 short paragraph or a few flat bullets. " +
                "Prefer this answer pattern when useful: short lead-in, 1 to 4 recommendations with reasons, then one brief follow-up question if needed. " +
                "If books are available, mention their titles exactly as given in the catalog context.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `Recent conversation:\n${conversationContext}\n\n` +
                  `User question:\n${message}\n\n` +
                  `Catalog context:\n${catalogContext}\n\n` +
                  "Answer in a helpful library-assistant style. " +
                  "If there are good matches, recommend 1 to 4 books from the catalog and explain each match briefly. " +
                  "If there are only partial matches, say that honestly and suggest the nearest useful books from the catalog. " +
                  "If the request is vague, ask one short follow-up question at the end. " +
                  "Use clear formatting and avoid sounding repetitive or overly formal.",
              },
            ],
          },
        ],
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    const apiMessage =
      payload?.error?.message || `Gemini API request failed with status ${response.status}.`;
    throw new Error(apiMessage);
  }

  return extractText(payload);
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    config: {
      supabaseUrl: Boolean(SUPABASE_URL),
      usingServiceRole,
      geminiApiKeyConfigured: Boolean(GEMINI_API_KEY),
      geminiModel: GEMINI_MODEL,
    },
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({ error: "A message is required." });
    }

    const matchedBooks = await searchBooks(message);
    const catalogContext = fallbackBooksPrompt(matchedBooks);
    const reply = await generateLibraryAnswer(message, catalogContext, history);

    if (!reply) {
      return res.status(502).json({ error: "Gemini API returned an empty response." });
    }

    return res.json({
      reply,
      matchedBooks: matchedBooks.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete the chat request.";
    return res.status(500).json({
      error: message,
      hints: [
        "Make sure backend/.env exists and includes Supabase and Gemini API settings.",
        "Verify that GEMINI_API_KEY is valid and allowed to use the selected model.",
        "If you want the backend to read all books reliably, use SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
      ],
    });
  }
});

app.listen(Number(PORT), () => {
  console.log(`AI Library backend listening on http://localhost:${PORT}`);
});
