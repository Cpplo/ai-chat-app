import { useNavigate } from "react-router";
import { BookOpen, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-slate-200 p-6 dark:bg-slate-700">
            <BookOpen className="w-20 h-20 text-slate-400 dark:text-slate-500" />
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-50">404</h1>
        <h2 className="mb-4 text-xl font-medium text-slate-700 dark:text-slate-300">Page Not Found</h2>
        <p className="mb-8 text-slate-600 dark:text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate("/")} className="gap-2">
          <Home className="w-4 h-4" />
          Go to Library
        </Button>
      </div>
    </div>
  );
}
