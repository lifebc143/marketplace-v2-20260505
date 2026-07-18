import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Terms() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{t("terms.title")}</h1>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
            >
              {t("terms.backToHome")}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-4xl">
          <p className="text-sm text-muted-foreground mb-8">
            {t("terms.lastUpdated")}
          </p>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section1Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section1Content")}
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section2Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section2Content")}
            </p>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section3Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section3Content")}
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section4Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section4Content")}
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section5Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section5Content")}
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section6Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section6Content")}
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{t("terms.section7Title")}</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {t("terms.section7Content")}
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-border pt-8 mt-8">
            <p className="text-base leading-relaxed">
              {t("terms.contactUs")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
