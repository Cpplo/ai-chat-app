import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, FileText, Calendar, Globe, BookOpen, Building2, Hash, Layers3, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../lib/supabase";
import { formatFileSize, mapBookRecordToLibraryBook, type BookRecord, type LibraryBook } from "../lib/books";
import { useAuth } from "../providers/AuthProvider";
import { recordRecentActivity } from "../lib/personalization";

const relatedConceptMap = {
  ai: ["artificial intelligence", "machine learning", "ml", "neural networks", "deep learning"],
  python: ["python", "programming", "coding", "software"],
  javascript: ["javascript", "web development", "frontend", "programming"],
  security: ["security", "cybersecurity", "cryptography", "privacy", "network security"],
  data: ["data", "data science", "analytics", "data mining", "information retrieval"],
  web: ["web", "frontend", "backend", "html", "css", "javascript", "react"],
  react: ["react", "frontend", "javascript", "web development", "ui"],
  database: ["database", "sql", "postgres", "query", "data storage"],
  algorithm: ["algorithm", "algorithms", "data structures", "problem solving"],
  research: ["research", "information retrieval", "analysis", "study", "academic"],
};

const relatedPhraseSynonyms = [
  { pattern: /\bartificial intelligence\b/g, replacement: "ai" },
  { pattern: /\bmachine learning\b/g, replacement: "ai" },
  { pattern: /\bcyber security\b/g, replacement: "security" },
  { pattern: /\bdata science\b/g, replacement: "data" },
  { pattern: /\bweb development\b/g, replacement: "web" },
  { pattern: /\bdata structures\b/g, replacement: "algorithm" },
];

function normalizeRelatedText(value: string) {
  let normalized = value.toLowerCase();
  for (const synonym of relatedPhraseSynonyms) {
    normalized = normalized.replace(synonym.pattern, synonym.replacement);
  }
  return normalized;
}

function extractTerms(value: string) {
  return normalizeRelatedText(value)
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);
}

function expandConceptTerms(terms: Set<string>, value: string) {
  const normalizedValue = normalizeRelatedText(value);

  for (const [concept, phrases] of Object.entries(relatedConceptMap)) {
    const matchesConcept =
      terms.has(concept) || phrases.some((phrase) => normalizedValue.includes(phrase));

    if (!matchesConcept) {
      continue;
    }

    terms.add(concept);
    for (const phrase of phrases) {
      for (const term of extractTerms(phrase)) {
        terms.add(term);
      }
    }
  }

  return terms;
}

function buildRelatedTerms(book: Pick<BookRecord, "title" | "description" | "category">) {
  const terms = new Set([
    ...extractTerms(book.title),
    ...extractTerms(book.description ?? ""),
    ...extractTerms(book.category ?? ""),
  ]);

  return expandConceptTerms(
    terms,
    [book.title, book.description ?? "", book.category ?? ""].join(" "),
  );
}

function scoreRelatedBook(target: BookRecord, candidate: BookRecord) {
  let score = 0;

  if (target.author && candidate.author && target.author === candidate.author) {
    score += 12;
  }

  if (target.category && candidate.category && target.category === candidate.category) {
    score += 9;
  }

  const targetTerms = buildRelatedTerms(target);
  const candidateTerms = buildRelatedTerms(candidate);

  for (const term of targetTerms) {
    if (candidateTerms.has(term)) {
      score += 2;
    }
  }

  const normalizedTargetTitle = normalizeRelatedText(target.title);
  const normalizedCandidateTitle = normalizeRelatedText(candidate.title);
  if (normalizedTargetTitle.includes(normalizedCandidateTitle) || normalizedCandidateTitle.includes(normalizedTargetTitle)) {
    score += 4;
  }

  if (candidate.has_file) {
    score += 1;
  }

  return score;
}

export function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<BookRecord | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) {
        setErrorMessage("No book id was provided.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .eq("is_public", true)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setErrorMessage("This book could not be found in the public catalog.");
          return;
        }

        setBook(data);

        const { data: candidates, error: candidatesError } = await supabase
          .from("books")
          .select("*")
          .eq("is_public", true)
          .neq("id", data.id)
          .limit(24);

        if (candidatesError) {
          throw candidatesError;
        }

        const rankedRelatedBooks = (candidates ?? [])
          .map((candidate) => ({
            candidate,
            score: scoreRelatedBook(data, candidate),
          }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
          .slice(0, 6)
          .map(({ candidate }) => mapBookRecordToLibraryBook(candidate));

        setRelatedBooks(rankedRelatedBooks);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load this book.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadBook();
  }, [bookId]);

  const libraryBook = useMemo(
    () => (book ? mapBookRecordToLibraryBook(book) : null),
    [book],
  );

  useEffect(() => {
    if (!user || !libraryBook) {
      return;
    }

    void recordRecentActivity(user.id, libraryBook, libraryBook.hasFile ? "opened" : "viewed");
  }, [libraryBook, user]);

  const handleOpenFile = () => {
    if (!libraryBook?.hasFile || !libraryBook.downloadUrl) {
      return;
    }

    window.open(libraryBook.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleExploreCategory = () => {
    if (!libraryBook?.category || libraryBook.category === "Uncategorized") {
      navigate("/");
      return;
    }

    navigate(`/?q=${encodeURIComponent(libraryBook.category)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" className="mb-3 gap-2 pl-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Book Details</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">See the full details for a book in your library collection.</p>
        </div>
      </div>

      {isLoading && (
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="h-80 rounded-lg bg-slate-200 dark:bg-slate-600" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-600" />
                <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-600" />
                <div className="h-24 rounded bg-slate-100 dark:bg-slate-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:border-red-950/70 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">Could not load book details</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && libraryBook && book && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40">
                {libraryBook.coverUrl ? (
                  <ImageWithFallback
                    src={libraryBook.coverUrl}
                    alt={`Cover for ${libraryBook.title}`}
                    className="h-[420px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    Cover unavailable
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{libraryBook.category}</Badge>
                <Badge variant={libraryBook.hasFile ? "default" : "outline"}>
                  {libraryBook.hasFile ? "File Ready" : "Metadata Only"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {libraryBook.source.replace("_", " ")}
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  className="w-full gap-2"
                  disabled={!libraryBook.hasFile || !libraryBook.downloadUrl}
                  onClick={handleOpenFile}
                >
                  {libraryBook.hasFile ? <Download className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {libraryBook.hasFile ? "Open File" : "No File Attached"}
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={handleExploreCategory}>
                  <Layers3 className="w-4 h-4" />
                  Explore {libraryBook.category === "Uncategorized" ? "Library" : libraryBook.category}
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/?q=${encodeURIComponent(libraryBook.title)}`)}>
                  <Search className="w-4 h-4" />
                  Find in Library
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/")}>
                  <BookOpen className="w-4 h-4" />
                  Back to Library
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl leading-tight">{libraryBook.title}</CardTitle>
                <CardDescription className="text-base">{libraryBook.author}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</h3>
                  <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{libraryBook.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Book Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Published Year
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{libraryBook.year ?? "Unknown"}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Publisher
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{book.publisher ?? "Unknown"}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    Language
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{book.language ?? "Unknown"}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    ISBN
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{book.isbn ?? "Not available"}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    File Format
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{libraryBook.fileFormat ?? "Catalog only"}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Download className="w-4 h-4 text-indigo-600" />
                    File Size
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{formatFileSize(libraryBook.fileSizeBytes)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Books</CardTitle>
                <CardDescription>
                  Discover more titles connected by category or author
                </CardDescription>
              </CardHeader>
              <CardContent>
                {relatedBooks.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No related titles are available in the public catalog yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {relatedBooks.map((relatedBook) => (
                      <button
                        key={relatedBook.id}
                        type="button"
                        onClick={() => navigate(`/books/${relatedBook.id}`)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-700/40 dark:hover:border-indigo-400 dark:hover:bg-indigo-700/30"
                      >
                        <p className="font-medium text-slate-900 dark:text-slate-100">{relatedBook.title}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{relatedBook.author}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="secondary">{relatedBook.category}</Badge>
                          <Badge variant={relatedBook.hasFile ? "default" : "outline"}>
                            {relatedBook.hasFile ? "File Available" : "Catalog Record"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
