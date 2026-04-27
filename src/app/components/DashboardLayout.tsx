import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { BookOpen, MessageSquare, User, LogOut, Menu, MoonStar, SunMedium, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, clearUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [isLoading, navigate, user]);

  const handleLogout = async () => {
    await clearUser();
    navigate("/login");
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { path: "/", icon: BookOpen, label: "Library" },
    { path: "/chat", icon: MessageSquare, label: "AI Assistant" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-800 dark:text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-600/80 dark:bg-slate-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                <div>
                  <h1 className="font-bold text-slate-900 dark:text-slate-50">AI Library</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Discover books and get grounded recommendations</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={location.pathname === item.path ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={toggleTheme}>
                {isDarkMode ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
                {isDarkMode ? "Light" : "Dark"}
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-300">Welcome, {user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-200 py-4 dark:border-slate-600/80 md:hidden">
              <nav className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-full justify-start gap-2"
                >
                  {isDarkMode ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
                  {isDarkMode ? "Light mode" : "Dark mode"}
                </Button>
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={location.pathname === item.path ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white dark:border-slate-600/80 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Copyright 2026 AI Library. All rights reserved.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Browse your catalog, save books, and explore with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
