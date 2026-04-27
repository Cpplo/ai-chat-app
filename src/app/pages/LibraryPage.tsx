import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, BookOpen, FileText, Heart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { formatFileSize, mapBookRecordToLibraryBook, type BookRecord } from "../lib/books";
import { getSavedBookIds, recordRecentActivity, toggleSavedBook } from "../lib/personalization";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadHint, setLoadHint] = useState<string | null>(null);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setLoadHint(null);

        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("is_public", true);

        if (error) {
          throw error;
        }

        setBooks(data ?? []);
        if ((data ?? []).length === 0) {
          setLoadHint(
            user
              ? "No public books are visible to this account yet. Check that your rows exist and `is_public` is set to true in Supabase."
              : "No books are visible right now. This page currently reads books through an authenticated policy, so make sure you are signed in and that your rows are marked `is_public = true`.",
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load books";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadBooks();
  }, [user]);

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    setSearchQuery(nextQuery);
  }, [searchParams]);

  const libraryBooks = useMemo(
    () => books.map(mapBookRecordToLibraryBook),
    [books],
  );

  useEffect(() => {
    const loadSavedBookIds = async () => {
      if (!user) {
        setSavedBookIds([]);
        return;
      }

      setSavedBookIds(await getSavedBookIds(user.id));
    };

    void loadSavedBookIds();
  }, [libraryBooks, user]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      libraryBooks
        .map((book) => book.category)
        .filter((category) => category.trim().length > 0),
    );

    return ["all", ...Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b))];
  }, [libraryBooks]);

  const filteredBooks = useMemo(() => {
    return [...libraryBooks]
      .filter((book) => {
        const matchesSearch =
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "author") return a.author.localeCompare(b.author);
        if (sortBy === "year") return (b.year ?? 0) - (a.year ?? 0);
        return 0;
      });
  }, [libraryBooks, searchQuery, selectedCategory, sortBy]);

  const handleOpenBook = async (book: (typeof filteredBooks)[number]) => {
    if (user) {
      await recordRecentActivity(user.id, book, book.hasFile ? "opened" : "viewed");
    }

    if (!book.hasFile || !book.downloadUrl) {
      toast.message(`"${book.title}" is available as a catalog record.`, {
        description: "This title can be viewed in the catalog, but no file is attached yet.",
      });
      return;
    }

    window.open(book.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleToggleSaved = async (book: (typeof filteredBooks)[number]) => {
    if (!user) {
      toast.error("Sign in to save books to your profile.");
      return;
    }

    const result = await toggleSavedBook(user.id, book);
    setSavedBookIds(result.savedBooks.map((entry) => entry.id));

    await recordRecentActivity(user.id, book, result.saved ? "saved" : "removed");

    toast.success(result.saved ? `"${book.title}" saved to your profile.` : `"${book.title}" removed from saved books.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Digital Library</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Browse books available in your library collection</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSearchQuery(nextValue);

                  const nextParams = new URLSearchParams(searchParams);
                  if (nextValue.trim()) {
                    nextParams.set("q", nextValue);
                  } else {
                    nextParams.delete("q");
                  }

                  setSearchParams(nextParams, { replace: true });
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="author">Author A-Z</SelectItem>
                <SelectItem value="year">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:border-red-950/70 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">Could not load books</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {!errorMessage && loadHint && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-950/70 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Books are not visible yet</p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{loadHint}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isLoading ? (
            <>Loading books...</>
          ) : (
            <>
              Found <strong>{filteredBooks.length}</strong> {filteredBooks.length === 1 ? "book" : "books"}
            </>
          )}
        </p>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-600" />
                <div className="h-6 w-full rounded bg-slate-200 dark:bg-slate-600" />
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="h-20 rounded bg-slate-100 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}

        {filteredBooks.map((book) => (
          <Card key={book.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{book.category}</Badge>
                <div className="flex items-center gap-1">
                  <Badge variant={book.hasFile ? "default" : "outline"}>
                    {book.hasFile ? "File Ready" : "Metadata Only"}
                  </Badge>
                </div>
              </div>
              <CardTitle className="line-clamp-2">{book.title}</CardTitle>
              <CardDescription>{book.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/40">
                {book.coverUrl ? (
                  <ImageWithFallback
                    src={book.coverUrl}
                    alt={`Cover for ${book.title}`}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    Cover unavailable
                  </div>
                )}
              </div>
              <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{book.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Year: {book.year ?? "Unknown"}</span>
                <span className="capitalize">{book.source.replace("_", " ")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatFileSize(book.fileSizeBytes)}</span>
                <span>{book.fileFormat ?? "Catalog"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant={savedBookIds.includes(book.id) ? "default" : "outline"}
                onClick={() => void handleToggleSaved(book)}
                className="gap-2"
              >
                <Heart className="w-4 h-4" />
                {savedBookIds.includes(book.id) ? "Saved" : "Save"}
              </Button>
              <Button onClick={() => void handleOpenBook(book)} className="flex-1 gap-2">
                {book.hasFile ? <Download className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {book.hasFile ? "Open File" : "View Record"}
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/books/${book.id}`)}>
                Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto mb-4 w-16 h-16 text-slate-300 dark:text-slate-700" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-50">No books found</h3>
          <p className="text-slate-600 dark:text-slate-400">
            {libraryBooks.length === 0
              ? loadHint ?? "Run the books migration and seed scripts in Supabase, then refresh this page."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
