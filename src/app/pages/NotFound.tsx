import { useNavigate } from "react-router";
import { BookOpen, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-200 p-6 rounded-full">
            <BookOpen className="w-20 h-20 text-gray-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-medium text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
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
