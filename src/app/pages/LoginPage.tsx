import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  BookOpen,
  Lock,
  Mail,
  MoonStar,
  Sparkles,
  SunMedium,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  login,
  requestPasswordReset,
  resendVerificationEmail,
  signup,
  startGoogleLogin,
} from "../lib/auth";
import { useAuth } from "../providers/AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("ai-library-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;
    setIsDarkMode(shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem("ai-library-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    const message = searchParams.get("message");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (message === "check-email") {
      toast.success("Check your email for the recovery link.");
    }

    if (error || errorDescription) {
      toast.error(errorDescription || error || "Authentication error");
    }
  }, [searchParams]);

  const emailIsValid = /\S+@\S+\.\S+/.test(email);
  const passwordLongEnough = password.length >= 8;
  const passwordHasMixedChars = /[A-Z]/.test(password) && /\d/.test(password);
  const confirmMatches = password === confirmPassword;
  const nameIsValid = name.trim().length >= 2;

  const canSubmit =
    mode === "login"
      ? emailIsValid && password.length > 0
      : mode === "signup"
      ? emailIsValid && passwordLongEnough && confirmMatches && nameIsValid
      : emailIsValid;

  const submitLabel = useMemo(() => {
    if (isSubmitting && mode === "login") return "Signing in...";
    if (isSubmitting && mode === "signup") return "Creating account...";
    if (isSubmitting && mode === "forgot") return "Sending reset link...";
    if (mode === "login") return "Sign In";
    if (mode === "signup") return "Create Account";
    return "Send reset link";
  }, [isSubmitting, mode]);

  const passwordHint = useMemo(() => {
    if (!password) {
      return "Use at least 8 characters with one uppercase letter and one number.";
    }
    if (!passwordLongEnough) {
      return "Password is too short.";
    }
    if (!passwordHasMixedChars) {
      return "Add one uppercase letter and one number for a stronger password.";
    }
    return "Strong enough for account creation.";
  }, [password, passwordHasMixedChars, passwordLongEnough]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      toast.error("Please fix the form before continuing.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "forgot") {
        const result = await requestPasswordReset(email);
        toast.success(result.message);
        return;
      }

      if (mode === "signup") {
        const result = await signup({ name, email, password });
        toast.success(result.message);
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const result = await login({ email, password });
      setUser(result.user);
      toast.success("Signed in successfully");
      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    try {
      const result = await resendVerificationEmail(email);
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not resend verification email";
      toast.error(message);
    }
  };

  const switchMode = (nextMode: "login" | "signup" | "forgot") => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_38%),linear-gradient(160deg,#f4f7ff_0%,#ffffff_46%,#eff9f6_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_35%),linear-gradient(160deg,#0f172a_0%,#111827_48%,#020617_100%)] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-xl">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-white/60 bg-white/70 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            onClick={() => setIsDarkMode((value) => !value)}
          >
            {isDarkMode ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
            {isDarkMode ? "Light mode" : "Dark mode"}
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-4 rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === "forgot" ? "Recover your account" : "AI Library System"}
          </h1>
          <p className="text-gray-600 dark:text-slate-300">
            {mode === "forgot"
              ? "Send yourself a secure reset link and create a new password."
              : "Email/password accounts with Google sign-in and polished recovery flows."}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary">v0.9</Badge>
            <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-100">
              Auth Upgrade
            </Badge>
          </div>
        </div>

        <Card className="border-white/70 bg-white/88 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/85 dark:shadow-black/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="dark:text-white">
                      {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Forgot Password"}
                    </CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      {mode === "login"
                        ? "Sign in with your email and password or continue with Google"
                        : mode === "signup"
                        ? "Create an account. Email verification is required before first login"
                        : "Enter your account email and Supabase will send a recovery link"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1 dark:border-slate-700 dark:text-slate-100">
                    <Sparkles className="w-3.5 h-3.5" />
                    Premium Flow
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Button
                    type="button"
                    variant={mode === "login" ? "default" : "outline"}
                    onClick={() => switchMode("login")}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "signup" ? "default" : "outline"}
                    onClick={() => switchMode("signup")}
                  >
                    Create Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {mode !== "forgot" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 justify-center gap-3 border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        void startGoogleLogin().catch((error) => {
                          const message = error instanceof Error ? error.message : "Could not start Google sign-in";
                          toast.error(message);
                        });
                      }}
                      disabled={isSubmitting}
                    >
                      <Mail className="w-4 h-4" />
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-slate-700" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white dark:bg-slate-900 px-3 text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                          or
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-slate-200">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className="pl-10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                          disabled={isSubmitting}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {name ? (nameIsValid ? "Looks good." : "Use at least 2 characters.") : "This name will appear on your profile."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@gmail.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="pl-10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {email ? (emailIsValid ? "Email format looks correct." : "Enter a valid email address.") : "Use the email you will verify in Supabase."}
                    </p>
                  </div>

                  {mode !== "forgot" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="dark:text-slate-200">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            id="password"
                            type="password"
                            placeholder={mode === "login" ? "Enter your password" : "Create a strong password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="pl-10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                            disabled={isSubmitting}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{passwordHint}</p>
                      </div>

                      {mode === "signup" && (
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="dark:text-slate-200">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Repeat your password"
                              value={confirmPassword}
                              onChange={(event) => setConfirmPassword(event.target.value)}
                              className="pl-10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                              disabled={isSubmitting}
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {confirmPassword ? (confirmMatches ? "Passwords match." : "Passwords do not match.") : "Repeat the same password to avoid typos."}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {mode === "login" && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto px-0 text-sm text-indigo-600 hover:bg-transparent dark:text-cyan-300"
                        onClick={() => switchMode("forgot")}
                      >
                        Forgot password?
                      </Button>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12" disabled={isSubmitting || !canSubmit}>
                    {submitLabel}
                  </Button>
                </form>

                {mode !== "forgot" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Email verification is required</p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/80">
                      Supabase will send the confirmation email through your SMTP setup before password login is allowed.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-auto px-0 text-amber-900 hover:bg-transparent dark:text-amber-200"
                      onClick={handleResendVerification}
                    >
                      Resend verification email
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/50">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Recovery flow</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Supabase emails a reset link. When the link opens, this app will route you to a secure password update screen.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-auto px-0 text-indigo-600 hover:bg-transparent dark:text-cyan-300"
                      onClick={() => switchMode("login")}
                    >
                      Back to sign in
                    </Button>
                  </div>
                )}
              </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Modern premium auth UI with dark mode, inline validation, and recovery support
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Authentication is handled by Supabase. Your Python backend is now reserved for future protected app data.
          </p>
        </div>
      </div>
    </div>
  );
}
