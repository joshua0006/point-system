
import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatModeToggle } from '@/components/chat/ChatModeToggle';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { useMarkMessagesAsRead } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Archive, Clock, CheckCircle } from 'lucide-react';

const Messages = () => {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isSellingMode, setIsSellingMode] = useState(true); // Default to selling mode for consultants
  const [activeFilter, setActiveFilter] = useState('active');
  
  const { data: conversations = [], isLoading } = useConversations();
  const markAsReadMutation = useMarkMessagesAsRead();

  // Helper function to determine conversation filter category
  const getConversationCategory = (conversation: Conversation) => {
    // Check if manually archived
    if (conversation.manual_archive) {
      return 'archive';
    }
    
    // Check conversation status first
    if (conversation.status === 'waiting_acceptance') {
      return 'waiting_acceptance';
    }
    
    // Check booking status for filtering
    if (conversation.booking) {
      switch (conversation.booking.status) {
        case 'pending':
          return 'waiting_acceptance';
        case 'confirmed':
        case 'completed':
          return 'active';
        case 'cancelled':
          return 'archive';
        default:
          return 'active';
      }
    }
    
    // Default to active if no booking info
    return 'active';
  };

  // Filter conversations based on mode for consultants and filter tabs
  const filteredConversations = (() => {
    let baseConversations = conversations;
    
    // First filter by consultant mode if applicable
    if (profile?.role === 'consultant') {
      baseConversations = conversations.filter(conversation => {
        if (isSellingMode) {
          // Show conversations where the consultant is selling (they are the seller)
          return conversation.seller_id === user?.id;
        } else {
          // Show conversations where the consultant is buying (they are the buyer)
          return conversation.buyer_id === user?.id;
        }
      });
    }
    
    // Then filter by status tab
    return baseConversations.filter(conversation => {
      const category = getConversationCategory(conversation);
      return category === activeFilter;
    });
  })();

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
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="waiting_acceptance" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Waiting
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    Archive
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading conversations...</p>
                    </div>
                  ) : (
                    <ConversationList 
                      conversations={filteredConversations}
                      onSelectConversation={handleSelectConversation}
                      activeFilter={activeFilter}
                    />
                  )}
                </div>
              </Tabs>
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
