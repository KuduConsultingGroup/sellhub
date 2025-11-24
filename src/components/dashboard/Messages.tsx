import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AttachmentUpload } from "@/components/messaging/AttachmentUpload";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";

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
  status: string;
  created_at: string;
  updated_at: string;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) {
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id);
      }
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedConversation)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as Message[]);
      markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", selectedConversation)
      .eq("sender_type", "admin")
      .eq("is_read", false);
  };

  const subscribeToMessages = () => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`
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

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation,
        sender_type: "user",
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

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        status: "open"
      })
      .select()
      .single();

    if (data) {
      setConversations([data, ...conversations]);
      setSelectedConversation(data.id);
      toast({ title: "New conversation started" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Chat with support</p>
        </div>
        <Button onClick={createNewConversation}>New Conversation</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <ScrollArea className="h-[calc(600px-60px)]">
            <div className="p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 rounded-xl text-left transition-colors mb-2 ${
                    selectedConversation === conv.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">S</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Support</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conv.updated_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    </div>
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
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">S</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Support</h3>
                    <p className="text-xs text-muted-foreground">Active conversation</p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      text={message.text}
                      senderType={message.sender_type}
                      timestamp={message.created_at}
                      attachments={message.attachments}
                      isRead={message.is_read}
                      isOwnMessage={message.sender_type === "user"}
                    />
                  ))}
                  {isTyping && <TypingIndicator name="Support" />}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  {selectedConversation && (
                    <AttachmentUpload
                      conversationId={selectedConversation}
                      onAttachmentSelect={(url, name, type) => setAttachment({ url, name, type })}
                    />
                  )}
                  <Input
                    placeholder="Type your message..."
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={loading}
                    className="rounded-xl"
                  />
                  <Button onClick={sendMessage} disabled={loading} className="rounded-xl">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;