import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChatBoxProps {
  conversationId: number;
  otherUserName?: string;
}

export default function ChatBox({ conversationId, otherUserName }: ChatBoxProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 獲取訊息
  const { data: messages, isLoading, refetch } = trpc.messages.getMessages.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  );

  // 發送訊息
  const sendMessageMutation = trpc.messages.sendMessage.useMutation();

  // 自動滾動到最新訊息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 定期刷新訊息
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000); // 每 3 秒刷新一次

    return () => clearInterval(interval);
  }, [refetch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("請輸入訊息");
      return;
    }

    setIsSending(true);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: message,
      });

      setMessage("");
      toast.success("訊息已發送");

      // 立即刷新訊息列表
      await refetch();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage = error?.data?.message || error?.message || "發送訊息失敗";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-96">
      {/* 聊天頭部 */}
      <div className="border-b p-4">
        <h3 className="font-semibold text-foreground">
          {otherUserName ? `與 ${otherUserName} 對話` : "訊息"}
        </h3>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === user?.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>暫無訊息，開始對話吧</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 訊息輸入框 */}
      <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="輸入訊息..."
          disabled={isSending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isSending || !message.trim()}
          size="sm"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </Card>
  );
}
