import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const utils = trpc.useUtils();
  
  const loginMutation = (trpc as any).auth.loginLocal.useMutation({
    onSuccess: async () => {
      setError("");
      setUsername("");
      setPassword("");
      // Auth state'i güncelle ve me query'sini invalidate et
      await utils.auth.me.invalidate();
      // Sayfayı yenile ve auth state'i güncelle
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    },
    onError: (err: any) => {
      setError(err.message || "Giriş başarısız. Lütfen tekrar deneyin.");
      setIsLoggingIn(false);
    },
  });

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);

    if (!username.trim()) {
      setError("Kullanıcı adı gereklidir");
      setIsLoggingIn(false);
      return;
    }

    if (!password) {
      setError("Şifre gereklidir");
      setIsLoggingIn(false);
      return;
    }

    loginMutation.mutate({ username, password });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-4">
              <span className="text-white text-2xl font-bold">KB</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Keban Food</h1>
            <p className="text-muted-foreground">Şube Performans Yönetim Sistemi</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Kullanıcı Adı
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Kullanıcı adınızı giriniz"
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                disabled={isLoggingIn}
                className="w-full"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Şifre
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Şifrenizi giriniz"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                className="w-full"
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">veya</span>
              </div>
            </div>

            {/* Manus OAuth Button */}
            <a href={loginUrl} className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full font-semibold py-3 rounded-lg transition-colors"
                size="lg"
              >
                Manus ile Giriş Yap
              </Button>
            </a>

            {/* Features Info */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4">Sistem Özellikleri</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">Gerçek zamanlı performans takibi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">Detaylı KPI hedef kartları</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">İnteraktif grafikler ve raporlar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">Rol tabanlı erişim kontrolü</span>
                </li>
              </ul>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            © 2026 Keban Food. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
