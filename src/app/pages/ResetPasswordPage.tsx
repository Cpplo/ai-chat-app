import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, KeyRound, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { updatePassword } from "../lib/auth";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessage = useMemo(() => {
    if (!password && !confirmPassword) return "";
    if (password.length < 8) return "Use at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  }, [confirmPassword, password]);

  const canSubmit = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      toast.error(validationMessage || "Enter a valid new password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await updatePassword(password);
      toast.success(result.message);
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update password";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_38%),linear-gradient(160deg,#f4f7ff_0%,#ffffff_46%,#eff9f6_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.16),_transparent_35%),linear-gradient(160deg,#334155_0%,#1e293b_55%,#334155_100%)] flex items-center justify-center px-4 py-10 transition-colors">
      <div className="w-full max-w-md">
        <Card className="border-white/60 bg-white/90 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-slate-600/60 dark:bg-slate-700/75 dark:shadow-black/15">
          <CardHeader className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              className="w-fit px-0 text-slate-500 hover:bg-transparent dark:text-slate-400"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-300/40">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-slate-50">Create a new password</CardTitle>
              <CardDescription className="dark:text-slate-300">
                You are in recovery mode. Choose a strong password to finish resetting your account.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="dark:text-slate-200">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10 dark:border-slate-600 dark:bg-slate-600/45 dark:text-slate-100"
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="dark:text-slate-200">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="pl-10 dark:border-slate-600 dark:bg-slate-600/45 dark:text-slate-100"
                    placeholder="Repeat your new password"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {validationMessage || "Use a password that is hard to guess and not reused elsewhere."}
              </p>

              <Button type="submit" className="w-full" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? "Updating password..." : "Save new password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
