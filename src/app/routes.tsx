import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ChatPage } from "./pages/ChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/auth/callback",
    Component: AuthCallbackPage,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: LibraryPage },
      { path: "books/:bookId", Component: BookDetailPage },
      { path: "chat", Component: ChatPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
