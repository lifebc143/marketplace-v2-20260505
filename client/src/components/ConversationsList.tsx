import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface ConversationsListProps {
  onSelectConversation: (conversationId: number) => void;
  selectedConversationId?: number;
}

export default function ConversationsList({
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const { user } = useAuth();

  // 獲取用戶的所有對話
  const { data: conversations, isLoading } = trpc.messages.getConversations.useQuery();

  if (!user) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <p>請先登錄以查看訊息</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </Card>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>暫無對話</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Button
          key={conversation.id}
          variant={selectedConversationId === conversation.id ? "default" : "outline"}
          className="w-full justify-start text-left"
          onClick={() => onSelectConversation(conversation.id)}
        >
          <div className="flex-1">
            <p className="font-medium">
              {conversation.buyerId === user.id ? "買家" : "賣家"}
            </p>
            <p className="text-xs opacity-70">
              最後訊息：{new Date(conversation.lastMessageAt).toLocaleString()}
            </p>
          </div>
        </Button>
      ))}
    </div>
  );
}
