import type { LibraryBook } from "./books";
import { supabase } from "./supabase";

export interface StoredBookSummary {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string | null;
  hasFile: boolean;
}

export interface RecentBookActivity extends StoredBookSummary {
  action: "opened" | "viewed" | "saved" | "removed";
  timestamp: string;
}

type LocalAction = RecentBookActivity["action"];
const personalizationEventName = "ai-library:personalization-updated";

function savedKey(userId: string) {
  return `ai-library:saved-books:${userId}`;
}

function activityKey(userId: string) {
  return `ai-library:recent-activity:${userId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifyPersonalizationUpdated(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(personalizationEventName, {
      detail: { userId },
    }),
  );
}

export function subscribeToPersonalizationUpdates(
  callback: (userId: string) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<{ userId?: string }>;
    if (customEvent.detail?.userId) {
      callback(customEvent.detail.userId);
    }
  };

  window.addEventListener(personalizationEventName, listener as EventListener);
  return () => window.removeEventListener(personalizationEventName, listener as EventListener);
}

function summarizeBook(book: LibraryBook): StoredBookSummary {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    coverUrl: book.coverUrl,
    hasFile: book.hasFile,
  };
}

function readLocalSavedBooks(userId: string): StoredBookSummary[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(savedKey(userId));
    return raw ? (JSON.parse(raw) as StoredBookSummary[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSavedBooks(userId: string, books: StoredBookSummary[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(savedKey(userId), JSON.stringify(books));
}

function readLocalRecentActivity(userId: string): RecentBookActivity[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(activityKey(userId));
    return raw ? (JSON.parse(raw) as RecentBookActivity[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRecentActivity(userId: string, activity: RecentBookActivity[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(activityKey(userId), JSON.stringify(activity));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = Reflect.get(error, "message");
    return typeof message === "string" ? message : "";
  }

  return "";
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Reflect.get(error, "code");
    return typeof code === "string" ? code : "";
  }

  return "";
}

function isMissingTableError(error: unknown) {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function shouldFallbackToLocal(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);

  return (
    isMissingTableError(error) ||
    code === "PGRST116" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("jwt") ||
    message.includes("not authenticated")
  );
}

function mapSavedRows(rows: Array<{ books: null | {
  id: string;
  title: string;
  author: string;
  category: string | null;
  cover_url: string | null;
  has_file: boolean;
} }>): StoredBookSummary[] {
  return rows
    .map((row) => row.books)
    .filter((book): book is NonNullable<typeof book> => Boolean(book))
    .map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category ?? "Uncategorized",
      coverUrl: book.cover_url,
      hasFile: book.has_file,
    }));
}

function mapActivityRows(rows: Array<{
  action: LocalAction;
  created_at: string;
  books: null | {
    id: string;
    title: string;
    author: string;
    category: string | null;
    cover_url: string | null;
    has_file: boolean;
  };
}>): RecentBookActivity[] {
  return rows
    .map((row) => {
      if (!row.books) {
        return null;
      }

      return {
        id: row.books.id,
        title: row.books.title,
        author: row.books.author,
        category: row.books.category ?? "Uncategorized",
        coverUrl: row.books.cover_url,
        hasFile: row.books.has_file,
        action: row.action,
        timestamp: row.created_at,
      };
    })
    .filter((entry): entry is RecentBookActivity => Boolean(entry));
}

async function migrateLocalSavedBooks(userId: string) {
  const localSaved = readLocalSavedBooks(userId);
  if (localSaved.length === 0) {
    return;
  }

  await supabase
    .from("user_saved_books")
    .upsert(
      localSaved.map((book) => ({
        user_id: userId,
        book_id: book.id,
      })),
      { onConflict: "user_id,book_id" },
    );
}

async function migrateLocalRecentActivity(userId: string) {
  const localActivity = readLocalRecentActivity(userId);
  if (localActivity.length === 0) {
    return;
  }

  await supabase.from("user_book_activity").insert(
    localActivity.slice(0, 10).map((entry) => ({
      user_id: userId,
      book_id: entry.id,
      action: entry.action,
      created_at: entry.timestamp,
    })),
  );
}

export async function getSavedBooks(userId: string): Promise<StoredBookSummary[]> {
  try {
    await migrateLocalSavedBooks(userId);

    const { data, error } = await supabase
      .from("user_saved_books")
      .select("books(id,title,author,category,cover_url,has_file)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const savedBooks = mapSavedRows((data ?? []) as Array<{ books: null | {
      id: string;
      title: string;
      author: string;
      category: string | null;
      cover_url: string | null;
      has_file: boolean;
    } }>);

    if (savedBooks.length > 0) {
      writeLocalSavedBooks(userId, savedBooks);
    }

    return savedBooks;
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    return readLocalSavedBooks(userId);
  }
}

export async function getSavedBookIds(userId: string) {
  const savedBooks = await getSavedBooks(userId);
  return savedBooks.map((book) => book.id);
}

export async function isBookSaved(userId: string, bookId: string) {
  const savedBookIds = await getSavedBookIds(userId);
  return savedBookIds.includes(bookId);
}

export async function toggleSavedBook(userId: string, book: LibraryBook) {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("user_saved_books")
      .select("book_id")
      .eq("user_id", userId)
      .eq("book_id", book.id)
      .maybeSingle();

    if (existingError && !isMissingTableError(existingError)) {
      throw existingError;
    }

    if (existing) {
      const { error } = await supabase
        .from("user_saved_books")
        .delete()
        .eq("user_id", userId)
        .eq("book_id", book.id);

      if (error) {
        throw error;
      }

      const next = readLocalSavedBooks(userId).filter((entry) => entry.id !== book.id);
      writeLocalSavedBooks(userId, next);
      notifyPersonalizationUpdated(userId);
      return { saved: false, savedBooks: next };
    }

    const { error } = await supabase.from("user_saved_books").insert({
      user_id: userId,
      book_id: book.id,
    });

    if (error) {
      throw error;
    }

    const next = await getSavedBooks(userId);
    notifyPersonalizationUpdated(userId);
    return { saved: true, savedBooks: next };
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    const current = readLocalSavedBooks(userId);
    const exists = current.some((entry) => entry.id === book.id);
    const next = exists
      ? current.filter((entry) => entry.id !== book.id)
      : [summarizeBook(book), ...current].slice(0, 12);

    writeLocalSavedBooks(userId, next);
    notifyPersonalizationUpdated(userId);
    return {
      saved: !exists,
      savedBooks: next,
    };
  }
}

export async function getRecentActivity(userId: string): Promise<RecentBookActivity[]> {
  try {
    await migrateLocalRecentActivity(userId);

    const { data, error } = await supabase
      .from("user_book_activity")
      .select("action,created_at,books(id,title,author,category,cover_url,has_file)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      throw error;
    }

    const activity = mapActivityRows((data ?? []) as Array<{
      action: LocalAction;
      created_at: string;
      books: null | {
        id: string;
        title: string;
        author: string;
        category: string | null;
        cover_url: string | null;
        has_file: boolean;
      };
    }>);

    if (activity.length > 0) {
      writeLocalRecentActivity(userId, activity);
    }

    return activity;
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    return readLocalRecentActivity(userId);
  }
}

export async function recordRecentActivity(
  userId: string,
  book: LibraryBook,
  action: LocalAction,
) {
  try {
    const { error } = await supabase.from("user_book_activity").insert({
      user_id: userId,
      book_id: book.id,
      action,
    });

    if (error) {
      throw error;
    }

    return await getRecentActivity(userId);
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error;
    }

    const summary = summarizeBook(book);
    const nextEntry: RecentBookActivity = {
      ...summary,
      action,
      timestamp: new Date().toISOString(),
    };

    const next = [
      nextEntry,
      ...readLocalRecentActivity(userId).filter(
        (entry) => !(entry.id === book.id && entry.action === action),
      ),
    ].slice(0, 12);

    writeLocalRecentActivity(userId, next);
    notifyPersonalizationUpdated(userId);
    return next;
  }
}
