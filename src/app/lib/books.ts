export type BookSource = "manual" | "open_library";

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string | null;
  published_year: number | null;
  publisher: string | null;
  language: string | null;
  isbn: string | null;
  cover_url: string | null;
  open_library_work_key: string | null;
  open_library_edition_key: string | null;
  source: BookSource;
  has_file: boolean;
  storage_path: string | null;
  download_url: string | null;
  file_format: string | null;
  file_size_bytes: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  year: number | null;
  coverUrl: string | null;
  source: BookSource;
  hasFile: boolean;
  downloadUrl: string | null;
  fileFormat: string | null;
  fileSizeBytes: number | null;
}

export function mapBookRecordToLibraryBook(book: BookRecord): LibraryBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description ?? "No description available yet.",
    category: book.category ?? "Uncategorized",
    year: book.published_year,
    coverUrl: book.cover_url,
    source: book.source,
    hasFile: book.has_file,
    downloadUrl: book.download_url,
    fileFormat: book.file_format,
    fileSizeBytes: book.file_size_bytes,
  };
}

export function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "No file";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
