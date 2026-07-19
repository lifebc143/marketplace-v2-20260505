import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Policy() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("footer.backToHome") || "Back to Home"}
          </Button>
          <h1 className="text-3xl font-bold">{t("policy.title") || "Trading Policy and Disclaimer"}</h1>
        </div>
      </div>

      <div className="container py-12 max-w-3xl">
        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section1Title") || "1. Platform Role"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              {t("policy.section1Content1") || "This website (Marketplace Second-hand Trading Platform) is a person-to-person (C2C) trading platform. Our role is limited to providing a trading venue where buyers and sellers can connect and conduct product transactions."}
            </p>
            <p>
              {t("policy.section1Content2") || "This website does not participate in any trading process, including but not limited to product inspection, quality assurance, payment processing, or after-sales service."}
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section2Title") || "2. Personal Trading Behavior"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              {t("policy.section2Content1") || "All transactions on the platform are personal actions between buyers and sellers. When creating an order, buyers and sellers indicate that they fully understand the nature of the transaction and are willing to assume corresponding responsibilities."}
            </p>
            <p>
              {t("policy.section2Content2") || "This website assumes no responsibility for any commitments, agreements, or transaction results between the parties."}
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section3Title") || "3. Payment Policy"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{t("policy.section3Bold") || "This website does not involve any payment processing."}</span>
              {t("policy.section3Content1") || " All payment methods (cash, transfer, third-party payment, etc.) are negotiated and decided by the buyer and seller themselves."}
            </p>
            <p>
              {t("policy.section3Content2") || "This website does not provide any payment, escrow, or refund services. Buyers and sellers must ensure transaction security themselves."}
            </p>
            <p>
              {t("policy.section3Content3") || "If payment disputes occur, this website is not responsible for mediation or handling."}
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section4Title") || "4. Product Quality and Responsibility"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{t("policy.section4Bold") || "Product quality, condition, and authenticity are the responsibility of the seller."}</span>
              {t("policy.section4Content1") || " Buyers should fully understand product information before trading and communicate with the seller."}
            </p>
            <p>
              {t("policy.section4Content2") || "This website makes no warranty or guarantee regarding product quality, authenticity, completeness, or legality."}
            </p>
            <p>
              {t("policy.section4Content3") || "If product disputes occur (such as counterfeits, damage, or description mismatch), buyers and sellers should resolve them through mutual negotiation."}
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section5Title") || "5. After-Sales Service"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{t("policy.section5Bold") || "All after-sales services (returns, exchanges, repairs, etc.) are provided by the seller."}</span>
              {t("policy.section5Content1") || " This website does not provide any after-sales support or protection."}
            </p>
            <p>
              {t("policy.section5Content2") || "Buyers should confirm the seller's after-sales policy before purchasing."}
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section6Title") || "6. Transaction Safety"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{t("policy.section6Bold") || "Buyers and sellers should take measures to ensure transaction safety."}</span>
              {t("policy.section6Intro") || " Recommendations:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("policy.section6Item1") || "Conduct transactions in safe public places"}</li>
              <li>{t("policy.section6Item2") || "Verify product authenticity and condition"}</li>
              <li>{t("policy.section6Item3") || "Confirm payment method and amount"}</li>
              <li>{t("policy.section6Item4") || "Keep transaction records and receipts"}</li>
              <li>{t("policy.section6Item5") || "Be alert to fraud and suspicious transactions"}</li>
            </ul>
            <p>
              {t("policy.section6Content") || "This website is not responsible for any safety issues that occur during the transaction process (such as fraud, robbery, or loss)."}
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section7Title") || "7. Dispute Resolution"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{t("policy.section7Bold") || "This website does not provide any dispute resolution or mediation services."}</span>
              {t("policy.section7Content1") || " If trading disputes occur, buyers and sellers should resolve them through the following methods:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("policy.section7Item1") || "Direct communication and negotiation"}</li>
              <li>{t("policy.section7Item2") || "Seek third-party mediation"}</li>
              <li>{t("policy.section7Item3") || "Resolve through legal channels"}</li>
            </ul>
            <p>
              {t("policy.section7Content2") || "This website assumes no legal responsibility for any disputes."}
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section8Title") || "8. Platform Liability Limitation"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              {t("policy.section8Content") || "This website is not responsible for any of the following under any circumstances:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("policy.section8Item1") || "Any loss or damage during the transaction process"}</li>
              <li>{t("policy.section8Item2") || "Product quality or authenticity issues"}</li>
              <li>{t("policy.section8Item3") || "Payment disputes or payment issues"}</li>
              <li>{t("policy.section8Item4") || "Personal injury or property loss"}</li>
              <li>{t("policy.section8Item5") || "Indirect, incidental, or consequential damages"}</li>
              <li>{t("policy.section8Item6") || "Any loss resulting from the use of this platform"}</li>
            </ul>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section9Title") || "9. User Responsibility"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              {t("policy.section9Content") || "Users of this platform should:"}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t("policy.section9Item1") || "Provide true and accurate personal information"}</li>
              <li>{t("policy.section9Item2") || "Comply with all applicable laws and regulations"}</li>
              <li>{t("policy.section9Item3") || "Not post false, misleading, or illegal product information"}</li>
              <li>{t("policy.section9Item4") || "Not engage in fraud, harassment, or other misconduct"}</li>
              <li>{t("policy.section9Item5") || "Assume all transaction risks themselves"}</li>
              <li>{t("policy.section9Item6") || "Resolve transaction disputes themselves"}</li>
            </ul>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t("policy.section10Title") || "10. Policy Changes"}</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              {t("policy.section10Content1") || "This website reserves the right to modify this policy at any time. Users should regularly check this page for the latest policy."}
            </p>
            <p>
              {t("policy.section10Content2") || "Continued use of this platform indicates the user's agreement to the latest policy terms."}
            </p>
          </div>
        </section>

        {/* Important Note */}
        <div className="bg-accent/10 border border-accent rounded-lg p-6 mb-12">
          <h3 className="text-lg font-bold text-accent mb-3">⚠️ {t("policy.importantNote") || "Important Notice"}</h3>
          <p className="text-muted-foreground mb-3">
            {t("policy.importantContent1") || "Before using this platform for any transaction, please ensure that you have fully understood and agreed to all the above terms."}
          </p>
          <p className="text-muted-foreground">
            {t("policy.importantContent2") || "If you have any questions about this policy, please contact the platform administrator before conducting any transactions."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-4">
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => navigate("/")}
          >
            {t("footer.backToHome") || "Back to Home"}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            {t("footer.backToPrevious") || "Back to Previous"}
          </Button>
        </div>
      </div>
    </div>
  );
}
