import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Policy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
          <h1 className="text-3xl font-bold">交易政策與免責聲明</h1>
        </div>
      </div>

      <div className="container py-12 max-w-3xl">
        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. 平台角色</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              本網站（Marketplace 二手交易平台）是一個個人對個人（C2C）的交易平台。我們的角色僅限於提供一個交易場所，讓買家和賣家能夠相互聯繫並進行商品交易。
            </p>
            <p>
              本網站不參與任何交易過程，包括但不限於商品檢查、品質保證、金流處理或售後服務。
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. 個人交易行為</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              平台上的所有交易均為買賣雙方的個人行為。買家和賣家在創建訂單時，即表示他們已充分了解交易的性質，並願意承擔相應的責任。
            </p>
            <p>
              本網站對交易雙方的任何承諾、協議或交易結果不承擔任何責任。
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. 金流政策</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">本網站不涉及任何金流處理。</span>
              所有付款方式（現金、轉帳、第三方支付等）均由買賣雙方自行協商決定。
            </p>
            <p>
              本網站不提供任何支付、託管或退款服務。買家和賣家需要自行確保交易安全。
            </p>
            <p>
              如發生付款糾紛，本網站不負責調解或處理。
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. 商品品質與責任</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">商品品質、狀況和真實性由賣家負責。</span>
              買家應在交易前充分了解商品信息，並與賣家進行溝通。
            </p>
            <p>
              本網站不對商品的品質、真實性、完整性或合法性做出任何保證或擔保。
            </p>
            <p>
              如發生商品糾紛（如假貨、損壞、描述不符等），買賣雙方應自行協商解決。
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. 售後服務</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">所有售後服務（退貨、換貨、維修等）由賣家自行提供。</span>
              本網站不提供任何售後支持或保障。
            </p>
            <p>
              買家應在購買前與賣家確認售後政策。
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. 交易安全</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">買賣雙方應自行採取措施確保交易安全。</span>
              建議：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>在安全的公共場所進行交易</li>
              <li>驗證商品真實性和狀況</li>
              <li>確認付款方式和金額</li>
              <li>保留交易記錄和憑證</li>
              <li>警惕詐騙和可疑交易</li>
            </ul>
            <p>
              本網站不對任何交易過程中發生的安全問題（如詐騙、搶劫、損失等）承擔責任。
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. 糾紛解決</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">本網站不提供任何糾紛解決或調解服務。</span>
              如發生交易糾紛，買賣雙方應通過以下方式自行解決：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>直接溝通協商</li>
              <li>尋求第三方調解</li>
              <li>通過法律途徑解決</li>
            </ul>
            <p>
              本網站對任何糾紛不承擔任何法律責任。
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">8. 平台責任限制</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              本網站在任何情況下不對以下事項承擔責任：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>交易過程中的任何損失或損害</li>
              <li>商品品質或真實性問題</li>
              <li>付款糾紛或金流問題</li>
              <li>人身傷害或財產損失</li>
              <li>間接、附帶或後果性損害</li>
              <li>因使用本平台而產生的任何損失</li>
            </ul>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">9. 用戶責任</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              使用本平台的用戶應：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>提供真實、準確的個人信息</li>
              <li>遵守所有適用的法律和法規</li>
              <li>不發佈虛假、誤導或非法的商品信息</li>
              <li>不從事詐騙、騷擾或其他不當行為</li>
              <li>自行承擔所有交易風險</li>
              <li>自行解決交易糾紛</li>
            </ul>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">10. 政策變更</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              本網站保留隨時修改本政策的權利。用戶應定期查看本頁面以了解最新政策。
            </p>
            <p>
              繼續使用本平台即表示用戶同意最新的政策條款。
            </p>
          </div>
        </section>

        {/* Important Note */}
        <div className="bg-accent/10 border border-accent rounded-lg p-6 mb-12">
          <h3 className="text-lg font-bold text-accent mb-3">⚠️ 重要提示</h3>
          <p className="text-muted-foreground mb-3">
            在使用本平台進行任何交易前，請確保您已充分理解並同意上述所有條款。
          </p>
          <p className="text-muted-foreground">
            如您對本政策有任何疑問，請在進行交易前與平台管理員聯繫。
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-4">
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => navigate("/")}
          >
            返回首頁
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            返回上一頁
          </Button>
        </div>
      </div>
    </div>
  );
}
