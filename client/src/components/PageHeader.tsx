import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export default function PageHeader({
  title,
  description,
  showBackButton = true,
}: PageHeaderProps) {
  const [, navigate] = useLocation();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="container py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="h-8 w-8"
                  title="Geri Git"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            </div>
            {description && (
              <p className="text-muted-foreground ml-11">{description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoHome}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
