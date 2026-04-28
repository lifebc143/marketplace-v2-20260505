import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import ChatBox from "@/components/ChatBox";
import ConversationsList from "@/components/ConversationsList";

export default function Messages() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">請先登錄以查看訊息</p>
          <Button onClick={() => navigate("/")}>返回首頁</Button>
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
          返回首頁
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 對話列表 */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-4">訊息</h2>
            <ConversationsList
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId || undefined}
            />
          </div>

          {/* 聊天框 */}
          <div className="md:col-span-2">
            {selectedConversationId ? (
              <ChatBox conversationId={selectedConversationId} />
            ) : (
              <Card className="p-8 text-center text-muted-foreground h-96 flex items-center justify-center">
                <p>選擇一個對話開始聊天</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
