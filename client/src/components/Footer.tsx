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
              <a href="mailto:lifeabcaglary@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition">
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
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/ammolitelife/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="Instagram"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
              </a>
            </div>
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
