import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Search, Filter, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AttachmentUpload } from "@/components/messaging/AttachmentUpload";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { MessageTemplates } from "@/components/messaging/MessageTemplates";
import { UserProfilePopup } from "@/components/messaging/UserProfilePopup";

interface Message {
  id: string;
  text: string;
  sender_type: "user" | "guest" | "admin";
  created_at: string;
  attachments?: any;
  is_read: boolean;
}

interface Conversation {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const MessagesManagement = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    if (statusFilter !== "all") {
      filtered = filtered.filter((conv) => conv.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (conv) =>
          conv.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.guest_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredConversations(filtered);
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedConversation.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedConversation) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_type: "admin",
        sender_id: user?.id,
        text: inputText,
        attachments: attachment ? [attachment] : null,
      });

    if (error) {
      toast({ title: "Error sending message", variant: "destructive" });
    } else {
      setInputText("");
      setAttachment(null);
    }

    setLoading(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (text.length > 0) {
      setIsTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  const updateConversationStatus = async (status: string) => {
    if (!selectedConversation) return;

    const { error } = await supabase
      .from("conversations")
      .update({ status })
      .eq("id", selectedConversation.id);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      setSelectedConversation({ ...selectedConversation, status });
      loadConversations();
      toast({ title: "Status updated" });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const getDisplayName = (conv: Conversation) => {
    if (conv.guest_name) return conv.guest_name;
    if (conv.user_id) return "Registered User";
    return "Anonymous";
  };

  const FiltersSidebar = () => (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4 h-full">
      <div>
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium mb-2">Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{conversations.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Open</span>
            <span className="font-medium text-green-600">
              {conversations.filter((c) => c.status === "open").length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium text-yellow-600">
              {conversations.filter((c) => c.status === "pending").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 lg:static lg:h-auto flex flex-col bg-background overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          {selectedConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedConversation(null);
                setShowMobileConversations(true);
              }}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-xs text-muted-foreground">
              {selectedConversation ? getDisplayName(selectedConversation) : `${filteredConversations.length} conversations`}
            </p>
          </div>
        </div>
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersSidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block p-6 border-b border-border bg-card shrink-0">
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Manage customer conversations</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-6 lg:p-6 h-full">
          {/* Filters Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <FiltersSidebar />
          </div>

          {/* Conversations List */}
          <div className={`${
            selectedConversation ? 'hidden' : 'block'
          } lg:block lg:col-span-1 bg-card lg:rounded-2xl border-r lg:border border-border overflow-hidden h-full`}>
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold">Conversations ({filteredConversations.length})</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-14rem)]">
            <div className="p-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowMobileConversations(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-colors mb-2 ${
                    selectedConversation?.id === conv.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{getDisplayName(conv)}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          conv.status === "open"
                            ? "bg-green-500/20 text-green-600"
                            : conv.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-gray-500/20 text-gray-600"
                        }`}
                      >
                        {conv.status}
                      </span>
                    </div>
                    {conv.guest_email && (
                      <p className="text-xs text-muted-foreground">{conv.guest_email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conv.updated_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className={`${
          !selectedConversation ? 'hidden' : 'block'
        } lg:block lg:col-span-2 bg-card lg:rounded-2xl border-r lg:border border-border overflow-hidden flex flex-col h-full`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {getDisplayName(selectedConversation).charAt(0)}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowProfilePopup(true)}
                      className="text-left hover:opacity-80 transition-opacity"
                    >
                      <h3 className="font-semibold hover:underline">{getDisplayName(selectedConversation)}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.guest_email || "No email provided"}
                        </p>
                        {selectedConversation.user_id ? (
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                            Registered
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                            Guest
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedConversation.status}
                      onValueChange={updateConversationStatus}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-full" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        text={message.text}
                        senderType={message.sender_type}
                        timestamp={message.created_at}
                        attachments={message.attachments}
                        isRead={message.is_read}
                        isOwnMessage={message.sender_type === "admin"}
                      />
                    ))}
                    {isTyping && <TypingIndicator name="Customer" />}
                  </div>
                </ScrollArea>
              </div>

              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <MessageTemplates onSelectTemplate={(content) => setInputText(content)} />
                  {selectedConversation && (
                    <AttachmentUpload
                      conversationId={selectedConversation.id}
                      onAttachmentSelect={(url, name, type) => setAttachment({ url, name, type })}
                    />
                  )}
                  <Input
                    placeholder="Type your reply..."
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={loading}
                    className="rounded-xl flex-1"
                  />
                  <Button onClick={sendMessage} disabled={loading} className="rounded-xl shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <UserProfilePopup
                userId={selectedConversation?.user_id || null}
                guestName={selectedConversation?.guest_name}
                guestEmail={selectedConversation?.guest_email}
                open={showProfilePopup}
                onOpenChange={setShowProfilePopup}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
              <div>
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default MessagesManagement;