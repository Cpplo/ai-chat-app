import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const completeAuth = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
      const errorDescription =
        url.searchParams.get("error_description") ||
        hashParams.get("error_description");

      if (errorDescription) {
        toast.error(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        navigate("/login", { replace: true });
        return;
      }

      const authCode = url.searchParams.get("code");
      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) {
          toast.error(error.message);
          navigate("/login", { replace: true });
          return;
        }
      }

      const flowType =
        url.searchParams.get("type") ||
        hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const isRecoveryFlow = flowType === "recovery";

      if (isRecoveryFlow && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          toast.error(error.message);
          navigate("/login", { replace: true });
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        toast.error(error.message);
        navigate("/login", { replace: true });
        return;
      }

      if (isRecoveryFlow && data.session) {
        toast.success("Recovery verified. Set your new password.");
        navigate("/reset-password", { replace: true });
        return;
      }

      if (data.session) {
        toast.success("Authentication complete.");
        navigate("/", { replace: true });
        return;
      }

      toast.success("Email verified. You can now sign in.");
      navigate("/login", { replace: true });
    };

    void completeAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 dark:bg-slate-800 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/60">
          <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Completing sign-in</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Finalizing your Supabase session and redirecting you.</p>
        </div>
      </div>
    </div>
  );
}
