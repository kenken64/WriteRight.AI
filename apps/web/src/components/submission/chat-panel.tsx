'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useSubmissionMessages, useSendMessage } from '@/lib/api/client';
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages';

interface ChatPanelProps {
  submissionId: string;
  currentUserId: string;
}

export function ChatPanel({ submissionId, currentUserId }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading } = useSubmissionMessages(submissionId);
  const sendMessage = useSendMessage();

  useRealtimeMessages(submissionId);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    setInput('');
    sendMessage.mutate({ submissionId, content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="mt-6 rounded-lg border bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="font-medium">Messages</span>
          {messages.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {messages.length}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t">
          <div ref={scrollRef} className="max-h-80 min-h-[120px] space-y-3 overflow-y-auto p-4">
            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && messages.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No messages yet. Start a conversation about this submission.
              </p>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {!isMine && msg.sender && (
                      <span className="mb-0.5 block text-xs font-medium opacity-70">
                        {msg.sender.display_name}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`mt-1 block text-[10px] ${
                        isMine ? 'text-white/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            {sendMessage.isPending && (
              <div className="flex justify-end">
                <div className="rounded-lg bg-primary/50 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sendMessage.isPending}
                placeholder="Type a message..."
                maxLength={2000}
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
                className="rounded-md bg-primary p-2 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
