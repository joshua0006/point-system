import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  
  const { data: conversations = [], isLoading } = useConversations();

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading conversations...</p>
                </div>
              ) : (
                <ConversationList 
                  conversations={conversations}
                  onSelectConversation={handleSelectConversation}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ChatWindow
        conversation={selectedConversation}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
};

export default Messages;