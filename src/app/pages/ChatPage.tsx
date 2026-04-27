import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Send, Bot, User, Sparkles, BookOpen, Search, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  matchedBooks?: MatchedBook[];
}

interface MatchedBook {
  id: string;
  title: string;
  author: string;
  category?: string | null;
  coverUrl?: string | null;
  hasFile?: boolean;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const quickActions = [
  { icon: Search, label: "Search for AI books", query: "Show me books about artificial intelligence" },
  { icon: BookOpen, label: "Recommend beginner books", query: "What books do you recommend for beginners?" },
  { icon: Download, label: "Most popular downloads", query: "What are the most downloaded books?" },
];

export function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hello! I'm your AI Library Assistant. Ask me about topics, recommendations, or which books are available in your catalog.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const responseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-slot='scroll-area-viewport']",
    ) as HTMLDivElement | null;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const history = [...messages, userMessage].map((message) => ({
      type: message.type,
      content: message.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          history,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not get an AI response.");
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        type: "ai",
        content: payload.reply,
        timestamp: new Date(),
        matchedBooks: Array.isArray(payload.matchedBooks) ? payload.matchedBooks : [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not connect to the AI assistant.";
      toast.error(message);
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        type: "ai",
        content:
          "The library assistant is currently unavailable. Please check that the backend service is running and configured correctly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue);
  };

  const handleQuickAction = (query: string) => {
    void sendMessage(query);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">AI Assistant</h2>
            <p className="text-slate-600 dark:text-slate-400">Ask questions and receive book recommendations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat Area */}
        <Card className="lg:col-span-2 flex h-[70vh] min-h-[520px] flex-col sm:h-[75vh] lg:h-[calc(100vh-13rem)] lg:min-h-[620px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chat with AI</CardTitle>
                <CardDescription>Ask about topics, availability, and recommendations from your library catalog</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.type === "ai" && (
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg h-fit">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] rounded-lg p-3 sm:max-w-[80%] sm:p-4 ${
                        message.type === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-700/70 dark:text-slate-100"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      {message.type === "ai" && message.matchedBooks && message.matchedBooks.length > 0 && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-700/70">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Catalog matches
                          </p>
                          <div className="mt-3 space-y-3">
                            {message.matchedBooks.slice(0, 4).map((book, index) => (
                              <div
                                key={book.id}
                                className={`rounded-md border px-3 py-3 ${
                                  index === 0
                                    ? "border-indigo-200 bg-indigo-50"
                                    : "border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/60"
                                }`}
                              >
                                {index === 0 && (
                                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                                    Best match
                                  </p>
                                )}
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{book.title}</p>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                  {book.author}
                                  {book.category ? ` - ${book.category}` : ""}
                                  {book.hasFile ? " - File available" : ""}
                                </p>
                                <Button
                                  variant="link"
                                  className="mt-2 h-auto p-0 text-indigo-600"
                                  onClick={() => navigate(`/books/${book.id}`)}
                                >
                                  Open details
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.type === "user" ? "text-indigo-200" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.type === "user" && (
                      <div className="bg-indigo-600 p-2 rounded-lg h-fit">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg h-fit">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-700/70">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white pt-3 dark:border-slate-600 dark:bg-transparent sm:pt-4">
              <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
                <Input
                  placeholder="Ask me anything about the library..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping}
                  className="h-11 sm:h-10"
                />
                <Button type="submit" disabled={isTyping || !inputValue.trim()} className="gap-2 px-4 sm:px-4">
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4 lg:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Try a few common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-2.5 sm:py-3"
                  onClick={() => handleQuickAction(action.query)}
                  disabled={isTyping}
                >
                  <action.icon className="w-5 h-5 text-indigo-600" />
                  <span className="text-left">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                  <span>Recommend books from your library collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                  <span>Answer topic and availability questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                  <span>Use real book information from your collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5" />
                  <span>Show the catalog titles used in each answer</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
