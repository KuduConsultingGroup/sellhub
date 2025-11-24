import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const templates = [
  {
    id: "greeting",
    title: "Greeting",
    content: "Hi! Thanks for reaching out. How can we help you today?",
  },
  {
    id: "order_update",
    title: "Order Processing",
    content: "Your order is currently being processed. We'll notify you when it ships.",
  },
  {
    id: "address_confirm",
    title: "Address Confirmation",
    content: "Could you please confirm your delivery address so we can look into this?",
  },
  {
    id: "replacement",
    title: "Replacement Created",
    content: "Your replacement order has been created. You will receive an email with details shortly.",
  },
  {
    id: "apology",
    title: "Apology",
    content: "We're sorry for the inconvenience. Let me help you resolve this right away.",
  },
  {
    id: "closing",
    title: "Closing",
    content: "Is there anything else I can help you with today?",
  },
];

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

export const MessageTemplates = ({ onSelectTemplate }: MessageTemplatesProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <FileText className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelectTemplate(template.content)}
            className="flex flex-col items-start gap-1 p-3"
          >
            <span className="font-medium text-sm">{template.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {template.content}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
