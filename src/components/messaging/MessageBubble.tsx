import { format } from "date-fns";
import { Check, CheckCheck, Download } from "lucide-react";

interface Attachment {
  url: string;
  name: string;
  type: string;
}

interface MessageBubbleProps {
  text: string;
  senderType: "user" | "guest" | "admin";
  timestamp: string;
  attachments?: Attachment[];
  isRead?: boolean;
  isOwnMessage?: boolean;
}

export const MessageBubble = ({
  text,
  senderType,
  timestamp,
  attachments,
  isRead,
  isOwnMessage,
}: MessageBubbleProps) => {
  const isAdmin = senderType === "admin";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAdmin
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{text}</p>
        
        {attachments && attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden">
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: "200px" }}
                  />
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs truncate">{attachment.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs opacity-70">
            {format(new Date(timestamp), "HH:mm")}
          </p>
          {isOwnMessage && (
            <div className="opacity-70">
              {isRead ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
