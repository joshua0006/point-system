
import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatModeToggle } from '@/components/chat/ChatModeToggle';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { useMarkMessagesAsRead } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isSellingMode, setIsSellingMode] = useState(true); // Default to selling mode for consultants
  
  const { data: conversations = [], isLoading } = useConversations();
  const markAsReadMutation = useMarkMessagesAsRead();

  // Filter conversations based on mode for consultants
  const filteredConversations = profile?.role === 'consultant' 
    ? conversations.filter(conversation => {
        if (isSellingMode) {
          // Show conversations where the consultant is selling (they are the seller)
          return conversation.seller_id === user?.id;
        } else {
          // Show conversations where the consultant is buying (they are the buyer)
          return conversation.buyer_id === user?.id;
        }
      })
    : conversations;

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
    
    // Mark messages as read when conversation is opened
    if (conversation.unread_count && conversation.unread_count > 0) {
      markAsReadMutation.mutate(conversation.id);
    }
  };

  // Mark messages as read when chat window is closed
  const handleChatClose = (open: boolean) => {
    if (!open && selectedConversation && selectedConversation.unread_count && selectedConversation.unread_count > 0) {
      markAsReadMutation.mutate(selectedConversation.id);
    }
    setChatOpen(open);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            </div>
            
            {/* Show mode toggle only for consultants */}
            {profile?.role === 'consultant' && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">View:</span>
                <ChatModeToggle 
                  isSellingMode={isSellingMode}
                  onModeChange={setIsSellingMode}
                />
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Conversations</span>
                {profile?.role === 'consultant' && (
                  <div className="text-sm text-muted-foreground">
                    {isSellingMode ? 'Services you\'re providing' : 'Services you\'re purchasing'}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading conversations...</p>
                </div>
              ) : (
                <ConversationList 
                  conversations={filteredConversations}
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
        onOpenChange={handleChatClose}
      />
    </div>
  );
};

export default Messages;
