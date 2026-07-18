import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.about")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("footer.aboutDescription")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.links")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition">
                  {t("footer.browseProducts")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-sm text-muted-foreground hover:text-foreground transition">
                  {t("footer.policy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.support")}</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@marketplace.com" className="text-sm text-muted-foreground hover:text-foreground transition">
                  {t("footer.contactUs")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
                  {t("footer.faq")}
                </a>
              </li>
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t("footer.followUs")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("footer.socialDescription")}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Marketplace. {t("footer.allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
}
