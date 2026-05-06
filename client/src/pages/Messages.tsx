import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ChatBox from "@/components/ChatBox";
import ConversationsList from "@/components/ConversationsList";
import { toast } from "sonner";

export default function Messages() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  // 從 URL 查詢參數中獲取賣家 ID
  const urlParams = new URLSearchParams(window.location.search);
  const sellerId = urlParams.get("sellerId");
  
  // 建立對話的 mutation
  const createConversationMutation = trpc.messages.getOrCreateConversation.useMutation();
  
  // 如果有 sellerId，自動建立對話
  useEffect(() => {
    if (sellerId && user && !isCreatingConversation) {
      setIsCreatingConversation(true);
      createConversationMutation.mutateAsync({
        sellerId: parseInt(sellerId),
        productId: 0, // 從商品詳情頁面來的，暫時不需要 productId
      })
        .then((result) => {
          setSelectedConversationId(result.conversationId);
          // 清除 URL 參數
          window.history.replaceState({}, "", "/messages");
        })
        .catch((error) => {
          console.error("Failed to create conversation:", error);
          toast.error(t("messagesPage.failedToCreate"));
        })
        .finally(() => {
          setIsCreatingConversation(false);
        });
    }
  }, [sellerId, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">{t("messagesPage.loginRequired")}</p>
          <Button onClick={() => navigate("/")}>{t("messagesPage.backToHome")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8">
        {/* 返回按鈕 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("messagesPage.backToHome")}
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 對話列表 */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-4">{t("messagesPage.title")}</h2>
            <ConversationsList
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId || undefined}
            />
          </div>
          {/* 聊天框 */}
          <div className="md:col-span-2">
            {isCreatingConversation ? (
              <Card className="p-8 text-center text-muted-foreground h-96 flex items-center justify-center">
                <div>
                  <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
                  <p>{t("messagesPage.creatingConversation")}</p>
                </div>
              </Card>
            ) : selectedConversationId ? (
              <ChatBox conversationId={selectedConversationId} />
            ) : (
              <Card className="p-8 text-center text-muted-foreground h-96 flex items-center justify-center">
                <p>{t("messagesPage.selectConversation")}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
