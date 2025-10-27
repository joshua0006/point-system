
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatModeToggle } from '@/components/chat/ChatModeToggle';
import { UndoToast } from '@/components/ui/undo-toast';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { useMarkMessagesAsRead } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Archive, Clock, CheckCircle } from '@/lib/icons';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';

const Messages = () => {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isSellingMode, setIsSellingMode] = useState(true); // Default to selling mode for consultants
  const [activeFilter, setActiveFilter] = useState('active');
  const [undoToastOpen, setUndoToastOpen] = useState(false);
  const [undoToastMessage, setUndoToastMessage] = useState('');
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);
  const isMobile = useIsMobile();
  
  const { data: conversations = [], isLoading } = useConversations();
  const markAsReadMutation = useMarkMessagesAsRead();

  // Listen for undo toast events
  useEffect(() => {
    const handleUndoToast = (event: CustomEvent) => {
      setUndoToastMessage(event.detail.message);
      setUndoAction(() => event.detail.onUndo);
      setUndoToastOpen(true);
    };

    window.addEventListener('showUndoToast', handleUndoToast as EventListener);
    
    return () => {
      window.removeEventListener('showUndoToast', handleUndoToast as EventListener);
    };
  }, []);

  // Helper function to determine conversation filter category
  const getConversationCategory = (conversation: Conversation) => {
    // Check if manually archived
    if (conversation.manual_archive) {
      return 'archive';
    }
    
    // Check booking status first - any pending booking goes to waiting
    if (conversation.booking && conversation.booking.status === 'pending') {
      return 'waiting_acceptance';
    }
    
    // Check conversation status
    if (conversation.status === 'waiting_acceptance') {
      return 'waiting_acceptance';
    }
    
    // Check other booking statuses
    if (conversation.booking) {
      switch (conversation.booking.status) {
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
    <SidebarLayout title="Messages" description="Manage your conversations and communications">
      <ResponsiveContainer>
        <div className="max-w-4xl mx-auto">
          <div className={isMobile ? "flex flex-col gap-4 mb-4" : "flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4"}>
            {/* Show mode toggle only for consultants */}
            {profile?.role === 'consultant' && (
              <div className={isMobile ? "flex items-center justify-center gap-2" : "flex items-center gap-3 sm:gap-4"}>
                <span className="text-sm text-muted-foreground">View:</span>
                <ChatModeToggle 
                  isSellingMode={isSellingMode}
                  onModeChange={setIsSellingMode}
                />
              </div>
            )}
          </div>

          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={isMobile ? "flex flex-col gap-2" : "flex items-center justify-between"}>
                <span className={isMobile ? "text-lg" : ""}>Your Conversations</span>
                {profile?.role === 'consultant' && (
                  <div className={isMobile ? "text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>
                    {isSellingMode ? 'Services you\'re providing' : 'Services you\'re purchasing'}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                <TabsList className={isMobile ? "grid w-full grid-cols-3 h-12" : "grid w-full grid-cols-3 h-11 sm:h-10"}>
                  <TabsTrigger value="active" className={isMobile ? "flex items-center gap-1 text-xs" : "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"}>
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Active</span>
                  </TabsTrigger>
                  <TabsTrigger value="waiting_acceptance" className={isMobile ? "flex items-center gap-1 text-xs" : "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"}>
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Waiting</span>
                    <span className="sm:hidden">Wait</span>
                  </TabsTrigger>
                  <TabsTrigger value="archive" className={isMobile ? "flex items-center gap-1 text-xs" : "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"}>
                    <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Archive</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className={isMobile ? "mt-4" : "mt-6"}>
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
      </ResponsiveContainer>

      <ChatWindow
        conversation={selectedConversation}
        open={chatOpen}
        onOpenChange={handleChatClose}
      />

      <UndoToast
        open={undoToastOpen}
        onClose={() => setUndoToastOpen(false)}
        onUndo={() => {
          if (undoAction) {
            undoAction();
          }
          setUndoToastOpen(false);
        }}
        message={undoToastMessage}
      />
    </SidebarLayout>
  );
};

export default Messages;
