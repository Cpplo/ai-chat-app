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

function formatUnknownError(error, fallbackMessage) {
  if (error instanceof Error) {
    const causeMessage =
      error.cause instanceof Error
        ? error.cause.message
        : typeof error.cause === "string"
          ? error.cause
          : "";

    return causeMessage && causeMessage !== error.message
      ? `${error.message} Cause: ${causeMessage}`
      : error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
}

function isFetchConnectivityError(error) {
  return (
    error instanceof TypeError &&
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("fetch failed")
  );
}

function buildConnectivityError(serviceName, error) {
  const detail = formatUnknownError(error, `${serviceName} request failed.`);

  return new Error(
    `${serviceName} could not be reached from the backend environment. ${detail}`,
    { cause: error },
  );
}

function escapeIlike(value) {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

async function getPublicBooks() {
  try {
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
  } catch (error) {
    if (isFetchConnectivityError(error)) {
      throw buildConnectivityError("Supabase", error);
    }

    throw new Error(`Supabase book query failed. ${formatUnknownError(error, "Unknown Supabase error.")}`, {
      cause: error,
    });
  }
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

const conceptMap = {
  ai: {
    aliases: ["ai", "artificial intelligence", "machine learning", "ml", "neural networks", "deep learning"],
    supporting: ["intelligent systems", "predictive models", "learning systems"],
  },
  python: {
    aliases: ["python"],
    supporting: ["coding", "programming", "scripts"],
  },
  javascript: {
    aliases: ["javascript", "js"],
    supporting: ["frontend", "web app", "web development"],
  },
  security: {
    aliases: ["security", "cybersecurity", "cryptography", "privacy", "network security"],
    supporting: ["defense", "protection", "secure systems"],
  },
  beginner: {
    aliases: ["beginner", "beginners", "introduction", "intro", "fundamentals", "basics", "starter", "easy"],
    supporting: ["start", "learn", "first steps"],
  },
  advanced: {
    aliases: ["advanced", "expert", "deep", "comprehensive"],
    supporting: ["research", "specialized", "in-depth"],
  },
  data: {
    aliases: ["data", "data science", "analytics", "data mining", "information retrieval"],
    supporting: ["datasets", "analysis", "retrieval"],
  },
  web: {
    aliases: ["web", "web development", "html", "css", "frontend", "backend"],
    supporting: ["browser", "website", "ui"],
  },
  react: {
    aliases: ["react"],
    supporting: ["frontend", "ui", "component"],
  },
  database: {
    aliases: ["database", "databases", "sql", "postgres", "query"],
    supporting: ["data storage", "schema", "relational"],
  },
  algorithm: {
    aliases: ["algorithm", "algorithms", "data structures", "problem solving"],
    supporting: ["complexity", "patterns", "computation"],
  },
  research: {
    aliases: ["research", "information retrieval", "analysis", "study", "academic"],
    supporting: ["literature", "evidence", "scholarly"],
  },
};

const intentSignals = {
  recommendation: ["recommend", "suggest", "good", "best", "start with", "should i read"],
  availability: ["do you have", "available", "in your catalog", "show me", "find"],
  comparison: ["compare", "better", "difference", "which one", "similar"],
  beginner: ["beginner", "beginners", "start learning", "new to", "easy", "intro", "introduction"],
  learningPath: ["where should i start", "start with", "learn first", "study first", "roadmap"],
  topicSearch: ["books about", "show me books about", "find books about", "looking for books on"],
};

const phraseSynonyms = [
  { pattern: /\bartificial intelligence\b/g, replacement: "ai" },
  { pattern: /\bmachine learning\b/g, replacement: "ai" },
  { pattern: /\bcyber security\b/g, replacement: "security" },
  { pattern: /\bdata science\b/g, replacement: "data" },
  { pattern: /\bweb development\b/g, replacement: "web" },
  { pattern: /\bdata structures\b/g, replacement: "algorithm" },
];

function extractKeywords(query) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !stopWords.has(term));
}

function normalizeQuery(query) {
  let normalized = query.toLowerCase();
  for (const synonym of phraseSynonyms) {
    normalized = normalized.replace(synonym.pattern, synonym.replacement);
  }
  return normalized;
}

function expandKeywords(keywords, query) {
  const expanded = new Set(keywords);
  const loweredQuery = normalizeQuery(query);

  for (const [concept, config] of Object.entries(conceptMap)) {
    const allTerms = [...config.aliases, ...config.supporting];
    const matchesConcept =
      expanded.has(concept) || allTerms.some((term) => loweredQuery.includes(term));

    if (matchesConcept) {
      expanded.add(concept);
      for (const term of allTerms) {
        for (const part of term.split(/[^a-z0-9+#.]+/)) {
          if (part && !stopWords.has(part) && part.length >= 2) {
            expanded.add(part);
          }
        }
      }
    }
  }

  return Array.from(expanded);
}

function detectIntent(query) {
  const loweredQuery = normalizeQuery(query);
  const intent = {
    recommendation: false,
    availability: false,
    comparison: false,
    beginner: false,
    learningPath: false,
    topicSearch: false,
  };

  for (const [intentName, phrases] of Object.entries(intentSignals)) {
    intent[intentName] = phrases.some((phrase) => loweredQuery.includes(phrase));
  }

  return intent;
}

function buildBookSearchText(book) {
  return [
    book.title,
    book.author,
    book.category,
    book.description,
    book.publisher,
    book.language,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getDetectedConcepts(query) {
  const normalizedQuery = normalizeQuery(query);

  return Object.entries(conceptMap)
    .filter(([, config]) =>
      [...config.aliases, ...config.supporting].some((term) => normalizedQuery.includes(term)),
    )
    .map(([concept]) => concept);
}

function getBookSignals(book) {
  const haystack = buildBookSearchText(book);
  const title = (book.title ?? "").toLowerCase();
  const category = (book.category ?? "").toLowerCase();
  const description = (book.description ?? "").toLowerCase();

  const concepts = Object.entries(conceptMap)
    .filter(([, config]) =>
      [...config.aliases, ...config.supporting].some(
        (term) => haystack.includes(term) || title.includes(term) || category.includes(term),
      ),
    )
    .map(([concept]) => concept);

  const beginner = [
    "beginner",
    "introduction",
    "intro",
    "fundamentals",
    "basics",
    "starter",
    "gentle",
    "practical introduction",
  ].some((term) => haystack.includes(term));

  const advanced = [
    "advanced",
    "expert",
    "comprehensive",
    "deep",
    "graduate",
    "in-depth",
  ].some((term) => haystack.includes(term));

  const practical = [
    "practical",
    "hands-on",
    "projects",
    "examples",
    "tutorial",
    "guide",
    "build",
  ].some((term) => haystack.includes(term));

  const theoretical = [
    "theory",
    "theoretical",
    "principles",
    "foundations",
    "research",
    "analysis",
  ].some((term) => haystack.includes(term));

  return {
    haystack,
    title,
    category,
    description,
    concepts,
    beginner,
    advanced,
    practical,
    theoretical,
  };
}

function buildRecommendationReasons(book, query, intent, bookSignals, matchedConcepts) {
  const reasons = [];

  if (matchedConcepts.length > 0) {
    reasons.push(`covers ${matchedConcepts.join(", ")}`);
  }

  if (intent.beginner && bookSignals.beginner) {
    reasons.push("fits a beginner-friendly request");
  }

  if (intent.learningPath && (bookSignals.beginner || bookSignals.practical)) {
    reasons.push("works well as a starting point");
  }

  if (intent.availability && book.has_file) {
    reasons.push("has a file available");
  }

  if (!intent.beginner && bookSignals.practical) {
    reasons.push("includes practical guidance");
  }

  if (book.category) {
    reasons.push(`belongs to ${book.category}`);
  }

  if (reasons.length === 0 && book.description) {
    reasons.push("matches the request based on its description");
  }

  return reasons.slice(0, 3);
}

function inferDifficulty(bookSignals) {
  if (bookSignals.beginner && !bookSignals.advanced) {
    return "Beginner-friendly";
  }

  if (bookSignals.advanced && !bookSignals.beginner) {
    return "Advanced";
  }

  return "Intermediate";
}

function inferLearningStyle(bookSignals) {
  if (bookSignals.practical && !bookSignals.theoretical) {
    return "Practical and example-driven";
  }

  if (bookSignals.theoretical && !bookSignals.practical) {
    return "More theory-focused";
  }

  if (bookSignals.practical && bookSignals.theoretical) {
    return "Balanced between theory and practice";
  }

  return "General-purpose learning style";
}

function buildPlainLanguageFit(book, intent, bookSignals, matchedConcepts) {
  const category = book.category ?? "general study";

  if (intent.beginner && bookSignals.beginner) {
    return `This is easier to start with and fits a beginner looking for ${category.toLowerCase()}.`;
  }

  if (intent.learningPath && bookSignals.practical) {
    return `This is a practical place to start if you want to learn ${category.toLowerCase()} step by step.`;
  }

  if (intent.availability && book.has_file) {
    return `This is a useful option because it matches the topic and has a file ready to open.`;
  }

  if (matchedConcepts.length > 0) {
    return `This fits because it directly covers ${matchedConcepts.join(", ")} in a ${category.toLowerCase()} context.`;
  }

  return `This looks like a relevant choice for ${category.toLowerCase()} based on the book information available.`;
}

function scoreBook(book, keywords, query, intent, detectedConcepts) {
  const haystack = buildBookSearchText(book);
  const normalizedQuery = normalizeQuery(query);
  const normalizedCategory = (book.category ?? "").toLowerCase();
  const signals = getBookSignals(book);
  const matchedConcepts = detectedConcepts.filter((concept) => signals.concepts.includes(concept));

  let score = 0;
  for (const keyword of keywords) {
    if (book.title?.toLowerCase().includes(keyword)) score += 5;
    if (book.category?.toLowerCase().includes(keyword)) score += 4;
    if (book.author?.toLowerCase().includes(keyword)) score += 3;
    if (book.description?.toLowerCase().includes(keyword)) score += 2;
    if (book.publisher?.toLowerCase().includes(keyword)) score += 1;
  }

  score += matchedConcepts.length * 8;

  if (detectedConcepts.length > 0 && matchedConcepts.length === 0) {
    score -= 6;
  }

  if (intent.beginner) {
    if (signals.beginner) score += 6;
    if (signals.practical) score += 3;
    if (signals.advanced) score -= 4;
  }

  if (intent.recommendation && book.description) {
    score += 1;
  }

  if (intent.availability && book.has_file) {
    score += 2;
  }

  if (intent.comparison && (book.description || book.category)) {
    score += 1;
  }

  if (intent.learningPath) {
    if (signals.beginner) score += 4;
    if (signals.practical) score += 2;
    if (signals.theoretical) score -= 1;
  }

  if (intent.topicSearch && book.category) {
    score += 1;
  }

  if (matchedConcepts.includes("python") && matchedConcepts.includes("security")) {
    score += 4;
  }

  if (matchedConcepts.includes("ai") && (normalizedCategory.includes("data") || normalizedCategory.includes("programming"))) {
    score += 2;
  }

  if (matchedConcepts.includes("web") && (normalizedCategory.includes("programming") || normalizedCategory.includes("software"))) {
    score += 2;
  }

  if (intent.learningPath && (book.title?.toLowerCase().includes("introduction") || book.title?.toLowerCase().includes("beginner"))) {
    score += 4;
  }

  if (normalizedQuery.includes("most popular") || normalizedQuery.includes("popular")) {
    if (book.has_file) {
      score += 1;
    }
  }

  if (keywords.length === 1 && haystack.includes(keywords[0])) {
    score += 2;
  }

  if (book.title && normalizedQuery.includes(book.title.toLowerCase())) {
    score += 8;
  }

  return {
    score,
    matchedConcepts,
    signals,
    reasons: buildRecommendationReasons(book, query, intent, signals, matchedConcepts),
  };
}

function buildSearchQuery(message, history) {
  const recentUserMessages = Array.isArray(history)
    ? history
        .slice(-4)
        .filter((entry) => entry?.type === "user" && typeof entry?.content === "string")
        .map((entry) => entry.content.trim())
        .filter(Boolean)
    : [];

  const current = message.trim();
  return recentUserMessages.length > 0 ? `${recentUserMessages.join(" ")} ${current}`.trim() : current;
}

async function searchBooks(query, history = []) {
  const trimmed = buildSearchQuery(query, history);
  if (!trimmed) {
    return [];
  }

  const books = await getPublicBooks();
  const baseKeywords = extractKeywords(trimmed);
  const keywords = expandKeywords(baseKeywords, trimmed);
  const intent = detectIntent(trimmed);
  const detectedConcepts = getDetectedConcepts(trimmed);

  const rankedBooks = books
    .map((book) => ({
      book,
      ...scoreBook(book, keywords, trimmed, intent, detectedConcepts),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .map(({ book, score, reasons, matchedConcepts, signals }) => ({
      book,
      score,
      reasons,
      matchedConcepts,
      signals,
    }));

  if (rankedBooks.length > 0) {
    const bestScore = rankedBooks[0].score;
    const scoreFloor = Math.max(bestScore - 4, 2);

    return rankedBooks
      .filter(({ score, matchedConcepts }, index) => index < 3 || score >= scoreFloor || matchedConcepts.length > 0)
      .slice(0, 6)
      .map(({ book, score, reasons, matchedConcepts, signals }) => ({
        ...book,
        _recommendationScore: score,
        _recommendationReasons: reasons,
        _matchedConcepts: matchedConcepts,
        _bookSignals: signals,
      }));
  }

  return books.slice(0, 5).map((book) => ({
    ...book,
    _recommendationScore: 0,
    _recommendationReasons: ["closest available catalog option"],
    _matchedConcepts: [],
    _bookSignals: getBookSignals(book),
  }));
}

function fallbackBooksPrompt(books, intent) {
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
        `Recommendation score: ${book._recommendationScore ?? 0}`,
        `Matched concepts: ${book._matchedConcepts?.join(", ") || "None"}`,
        `Why it may fit: ${book._recommendationReasons?.join("; ") || "No strong reason identified."}`,
        `Difficulty: ${inferDifficulty(book._bookSignals ?? {})}`,
        `Learning style: ${inferLearningStyle(book._bookSignals ?? {})}`,
        `Plain-language fit: ${buildPlainLanguageFit(book, intent, book._bookSignals ?? {}, book._matchedConcepts ?? [])}`,
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
  const userIntent = detectIntent(message);
  try {
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
                  "Write naturally, warmly, clearly, and in simple language for everyday users. " +
                  "Avoid academic wording, library jargon, and technical phrasing unless you explain it in plain words. " +
                  "Explain recommendations the way a helpful librarian would explain them to a student who wants a quick, easy-to-understand answer. " +
                  "Use recent conversation context to understand follow-up questions such as 'what about easier ones' or 'do you have something similar'. " +
                  "If the user's question is broad or vague, ask one short follow-up question or make a helpful assumption and say it clearly. " +
                  "If the catalog has weak or no direct matches, do not say only 'we do not have this'. " +
                  "Instead, say there is no strong direct match, then suggest the closest relevant books from the catalog if any exist. " +
                  "Never invent books that are not in the catalog context. " +
                  "Keep answers concise but useful, usually a short paragraph plus a few flat bullets at most. " +
                  "Prefer this answer pattern when useful: short lead-in, 1 to 3 recommendations with reasons, then one brief follow-up question if needed. " +
                  "When you have strong matches, be direct and confident. " +
                  "When one book is the clearest fit, present it first as the best choice before listing other options. " +
                  "Use labels like 'Best choice' and 'Other good options' when they make the answer easier to scan. " +
                  "When the request is about a skill level such as beginner or advanced, mention why each book fits that level in simple words. " +
                  "If the user asks an availability question, answer that clearly first before adding recommendations. " +
                  "Avoid filler. Avoid repeating the same phrasing from earlier turns. " +
                  "If one recommendation is clearly the strongest option, say that directly. " +
                  "If the user asks where to start, prioritize the most approachable title from the catalog. " +
                  "If books are available, mention their titles exactly as given in the catalog context. " +
                  "Pay close attention to the recommendation score, matched concepts, and fit reasons in the catalog context. " +
                  "Favor books with stronger match signals over books that are only loosely related. " +
                  "When possible, tell the user whether a book is beginner-friendly, practical, theory-focused, or better for someone with some prior knowledge. " +
                  "Use short sentences. Prefer clarity over sounding impressive.",
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
                    `Detected user intent:\n${JSON.stringify(userIntent)}\n\n` +
                    `Catalog context:\n${catalogContext}\n\n` +
                    "Answer in a helpful library-assistant style. " +
                    "If there are good matches, recommend 1 to 3 books from the catalog and explain each match briefly in plain language. " +
                    "If there are only partial matches, say that honestly and suggest the nearest useful books from the catalog. " +
                    "If the request is vague, ask one short follow-up question at the end. " +
                    "Use clear formatting and avoid sounding repetitive or overly formal. " +
                    "When possible, name one clear best choice first, then add a short 'Other good options' section only if it adds value. " +
                    "If useful, format the answer with short bullets, one book per bullet. " +
                    "Use the fit reasons to explain each recommendation in a concrete way. " +
                    "For each recommendation, try to answer these user-friendly questions: What is this book good for? Is it easy or harder? Is it practical or more theoretical? " +
                    "Avoid words like 'foundational', 'coverage', 'supervised learning pipeline', or 'methodological' unless you immediately explain them in simpler words.",
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
  } catch (error) {
    if (isFetchConnectivityError(error)) {
      throw buildConnectivityError("Gemini", error);
    }

    throw new Error(`Gemini request failed. ${formatUnknownError(error, "Unknown Gemini error.")}`, {
      cause: error,
    });
  }
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

    const matchedBooks = await searchBooks(message, history);
    const catalogContext = fallbackBooksPrompt(matchedBooks, detectIntent(buildSearchQuery(message, history)));
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
        category: book.category,
        coverUrl: book.cover_url,
        hasFile: book.has_file,
      })),
    });
  } catch (error) {
    const message = formatUnknownError(error, "Could not complete the chat request.");
    return res.status(500).json({
      error: message,
      hints: [
        "Make sure backend/.env exists and includes Supabase and Gemini API settings.",
        "Verify that GEMINI_API_KEY is valid and allowed to use the selected model.",
        "If you want the backend to read all books reliably, use SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
        "If the message says Supabase or Gemini could not be reached, check firewall, antivirus, proxy, or blocked outbound network access for Node.js.",
      ],
    });
  }
});

app.listen(Number(PORT), () => {
  console.log(`AI Library backend listening on http://localhost:${PORT}`);
});
