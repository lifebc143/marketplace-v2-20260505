import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ShoppingBag, LogOut, Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success(t("common.success"));
      navigate("/");
    } catch (error) {
      toast.error("登出失敗");
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition">
          <ShoppingBag className="w-6 h-6 text-accent" />
          <span>Marketplace</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm hover:text-accent transition">
            {t("nav.products")}
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/my-products" className="text-sm hover:text-accent transition">
                {t("nav.myProducts")}
              </Link>
              <Link href="/orders" className="text-sm hover:text-accent transition">
                {t("nav.orders")}
              </Link>
              <Link href="/messages" className="text-sm hover:text-accent transition">
                {t("nav.messages")}
              </Link>
            </>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{language.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLanguage("zh")}
                className={language === "zh" ? "bg-accent" : ""}
              >
                中文 (Chinese)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("en")}
                className={language === "en" ? "bg-accent" : ""}
              >
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    {t("nav.profile")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("nav.logout")}
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </>
          ) : (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-accent hover:bg-accent/90"
            >
              {t("nav.login")}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t p-4 space-y-2">
          <Link href="/products">
            <Button variant="ghost" className="w-full justify-start">
              {t("nav.products")}
            </Button>
          </Link>
          <Link href="/my-products">
            <Button variant="ghost" className="w-full justify-start">
              {t("nav.myProducts")}
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost" className="w-full justify-start">
              {t("nav.orders")}
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" className="w-full justify-start">
              {t("nav.messages")}
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start">
              {t("nav.profile")}
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("nav.logout")}
          </Button>
        </div>
      )}
    </nav>
  );
}
