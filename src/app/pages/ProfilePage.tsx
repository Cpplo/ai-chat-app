import { useEffect, useMemo, useState } from "react";
import { User, BookOpen, CheckCircle, Calendar, Heart, History } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../lib/supabase";
import {
  getRecentActivity,
  getSavedBooks,
  subscribeToPersonalizationUpdates,
  type RecentBookActivity,
  type StoredBookSummary,
} from "../lib/personalization";

interface ProfileSnapshot {
  memberSince: string | null;
  lastSignIn: string | null;
  totalPublicBooks: number;
  fileReadyBooks: number;
  totalCategories: number;
  topCategories: string[];
}

const initialSnapshot: ProfileSnapshot = {
  memberSince: null,
  lastSignIn: null,
  totalPublicBooks: 0,
  fileReadyBooks: 0,
  totalCategories: 0,
  topCategories: [],
};

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityLabel(action: RecentBookActivity["action"]) {
  if (action === "saved") {
    return "Saved to profile";
  }

  if (action === "removed") {
    return "Removed from saved books";
  }

  if (action === "opened") {
    return "Opened file";
  }

  return "Viewed in library";
}

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot>(initialSnapshot);
  const [savedBooks, setSavedBooks] = useState<StoredBookSummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentBookActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileSnapshot = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [{ data: authData, error: authError }, { data: books, error: booksError }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("books")
            .select("category,has_file,is_public")
            .eq("is_public", true),
        ]);

        if (authError) {
          throw authError;
        }

        if (booksError) {
          throw booksError;
        }

        const categoryCounts = new Map<string, number>();
        for (const book of books ?? []) {
          const category = book.category?.trim();
          if (!category) {
            continue;
          }

          categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
        }

        const topCategories = Array.from(categoryCounts.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 4)
          .map(([category]) => category);

        setSnapshot({
          memberSince: authData.user?.created_at ?? null,
          lastSignIn: authData.user?.last_sign_in_at ?? null,
          totalPublicBooks: books?.length ?? 0,
          fileReadyBooks: (books ?? []).filter((book) => book.has_file).length,
          totalCategories: categoryCounts.size,
          topCategories,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load your profile";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfileSnapshot();
  }, []);

  useEffect(() => {
    const loadPersonalization = async () => {
      if (!user) {
        setSavedBooks([]);
        setRecentActivity([]);
        return;
      }

      const [saved, activity] = await Promise.all([
        getSavedBooks(user.id),
        getRecentActivity(user.id),
      ]);

      setSavedBooks(saved);
      setRecentActivity(activity);
    };

    void loadPersonalization();

    const unsubscribe = subscribeToPersonalizationUpdates((updatedUserId) => {
      if (user && updatedUserId === user.id) {
        void loadPersonalization();
      }
    });

    const handleWindowFocus = () => {
      void loadPersonalization();
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [user]);

  const accountStatus = useMemo(
    () => [
      {
        label: "Member since",
        value: isLoading ? "Loading..." : formatDate(snapshot.memberSince),
        icon: Calendar,
      },
      {
        label: "Last sign in",
        value: isLoading ? "Loading..." : formatDateTime(snapshot.lastSignIn),
        icon: CheckCircle,
      },
    ],
    [isLoading, snapshot.lastSignIn, snapshot.memberSince],
  );

  const libraryStats = useMemo(
    () => [
      { icon: BookOpen, label: "Public books", value: isLoading ? "..." : String(snapshot.totalPublicBooks), color: "text-blue-600" },
      { icon: Heart, label: "Saved books", value: String(savedBooks.length), color: "text-rose-600" },
      { icon: History, label: "Recent actions", value: String(recentActivity.length), color: "text-purple-600" },
    ],
    [isLoading, recentActivity.length, savedBooks.length, snapshot.totalPublicBooks],
  );

  const openBookDetail = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Profile</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Your account details and a summary of your library activity</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{user?.name || "Reader"}</h3>
              <p className="text-slate-600 dark:text-slate-400">{user?.email || "No email linked"}</p>
              <Badge variant="secondary" className="mt-2">Active account</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:border-red-950/70 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">Could not load profile data</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {libraryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your account information and recent access details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accountStatus.map((item) => (
                <div key={item.label} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-950/60">
                    <item.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.label}</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Library Snapshot</CardTitle>
            <CardDescription>What the current public catalog looks like right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Top categories</p>
              <div className="flex flex-wrap gap-2">
                {isLoading && <Badge variant="secondary">Loading...</Badge>}
                {!isLoading && snapshot.topCategories.length === 0 && (
                  <Badge variant="outline">No categories found yet</Badge>
                )}
                {!isLoading &&
                  snapshot.topCategories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">Overview</p>
              <p className="text-sm text-blue-800">
                This profile now shows real account details, saved books, recent library activity,
                and a live catalog snapshot.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
              <p className="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Catalog overview</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {snapshot.fileReadyBooks} books currently have files attached across {snapshot.totalCategories} categories.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Books</CardTitle>
            <CardDescription>Books you chose to keep for quick access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedBooks.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You have not saved any books yet. Use the Save button in the Library to build a shortlist.
                </p>
              )}
              {savedBooks.map((book) => (
                <div key={book.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/40">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{book.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {book.author}
                    {book.category ? ` - ${book.category}` : ""}
                    {book.hasFile ? " - File ready" : ""}
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0 text-indigo-600"
                    onClick={() => openBookDetail(book.id)}
                  >
                    Open details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Library Activity</CardTitle>
            <CardDescription>Your most recent actions across the library experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No activity has been recorded yet. Open, save, or remove a book to see updates here.
                </p>
              )}
              {recentActivity.slice(0, 6).map((entry) => (
                <div key={`${entry.id}-${entry.action}-${entry.timestamp}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{entry.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {entry.author}
                        {entry.category ? ` - ${entry.category}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatActivityLabel(entry.action)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(entry.timestamp)}
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0 text-indigo-600"
                    onClick={() => openBookDetail(entry.id)}
                  >
                    Open details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
