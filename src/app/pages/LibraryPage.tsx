import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, BookOpen, FileText } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { formatFileSize, mapBookRecordToLibraryBook, type BookRecord } from "../lib/books";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function LibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadHint, setLoadHint] = useState<string | null>(null);

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

  const libraryBooks = useMemo(
    () => books.map(mapBookRecordToLibraryBook),
    [books],
  );

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

  const handleOpenBook = (book: (typeof filteredBooks)[number]) => {
    if (!book.hasFile || !book.downloadUrl) {
      toast.message(`"${book.title}" is currently catalog-only.`, {
        description: "This book record is available for browsing, but no file has been attached yet.",
      });
      return;
    }

    window.open(book.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Digital Library</h2>
        <p className="text-gray-600 mt-1">Browse real catalog records from your library database</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-900">Could not load books</p>
            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {!errorMessage && loadHint && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-amber-900">Books are not visible yet</p>
            <p className="mt-1 text-sm text-amber-800">{loadHint}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
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
                <div className="h-5 w-24 rounded bg-gray-200" />
                <div className="h-6 w-full rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="h-20 rounded bg-gray-100" />
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
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {book.coverUrl ? (
                  <ImageWithFallback
                    src={book.coverUrl}
                    alt={`Cover for ${book.title}`}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-500">
                    No cover image
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">{book.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Year: {book.year ?? "Unknown"}</span>
                <span className="capitalize">{book.source.replace("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>{formatFileSize(book.fileSizeBytes)}</span>
                <span>{book.fileFormat ?? "Catalog"}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleOpenBook(book)} className="w-full gap-2">
                {book.hasFile ? <Download className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {book.hasFile ? "Open File" : "View Record"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600">
            {libraryBooks.length === 0
              ? loadHint ?? "Run the books migration and seed scripts in Supabase, then refresh this page."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
