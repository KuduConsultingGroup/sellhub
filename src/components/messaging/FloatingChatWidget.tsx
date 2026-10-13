import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AttachmentUpload } from "./AttachmentUpload";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  id: string;
  text: string;
  sender_type: "user" | "guest" | "admin";
  created_at: string;
  attachments?: any;
  is_read: boolean;
}

export const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isGuestInfoNeeded, setIsGuestInfoNeeded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    if (session?.user) {
      await loadOrCreateConversation(session.user.id);
    }
  };

  const loadOrCreateConversation = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setConversationId(data.id);
    }
  };

  const createGuestConversation = async () => {
    if (!guestName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        guest_session_id: guestSessionId,
        guest_name: guestName,
        guest_email: guestEmail || null,
        status: "open"
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating conversation", variant: "destructive" });
      return;
    }

    setConversationId(data.id);
    setIsGuestInfoNeeded(false);
    localStorage.setItem("guestConversationId", data.id);
    
    // Send auto-greeting
    setTimeout(() => {
      sendAutoGreeting(data.id);
    }, 500);
  };

  const sendAutoGreeting = async (convId: string) => {
    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_type: "admin",
      text: `Hi ${guestName || "there"}! Thanks for reaching out. A member of our team will be with you shortly. How can we help you today?`,
    });
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as Message[]);
      markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversationId) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "admin")
      .eq("is_read", false);

    setUnreadCount(0);
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          
          if ((payload.new as Message).sender_type === "admin" && !isOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (!conversationId) {
      if (!user) {
        setIsGuestInfoNeeded(true);
        return;
      } else {
        // Create conversation for logged-in user
        const { data } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            status: "open"
          })
          .select()
          .single();
        
        if (data) {
          setConversationId(data.id);
          sendAutoGreeting(data.id);
        }
        return;
      }
    }

    setLoading(true);
    
    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: user ? "user" : "guest",
        sender_id: user?.id || null,
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
    
    // Simulate typing indicator
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

  const handleOpen = () => {
    setIsOpen(true);
    if (conversationId) {
      markMessagesAsRead();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-background rounded-2xl shadow-2xl border border-border overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Chat with us</h3>
              <p className="text-xs text-muted-foreground">We typically reply in a few minutes</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Guest Info Form */}
          {isGuestInfoNeeded && !conversationId && (
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Please introduce yourself to start chatting:</p>
              <Input
                placeholder="Your name *"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <Input
                placeholder="Your email (optional)"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
              <Button onClick={createGuestConversation} className="w-full">
                Start Chat
              </Button>
            </div>
          )}

          {/* Messages */}
          {!isGuestInfoNeeded && (
            <>
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
                      isOwnMessage={message.sender_type !== "admin"}
                    />
                  ))}
                  {isTyping && <TypingIndicator name="Support" />}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  {conversationId && (
                    <AttachmentUpload
                      conversationId={conversationId}
                      onAttachmentSelect={(url, name, type) => setAttachment({ url, name, type })}
                    />
                  )}
                  <Input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={sendMessage} size="icon" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};