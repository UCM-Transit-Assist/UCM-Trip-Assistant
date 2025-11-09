import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  generateContentWithMapsGrounding,
  MapsGroundingResponse,
} from "./backend";

interface ChatBotProps {
  onResponse: (data: MapsGroundingResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({
  onResponse,
  isLoading,
  setIsLoading,
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await generateContentWithMapsGrounding(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.text },
      ]);
      onResponse(response);
    } catch (error) {
      console.error("Error generating content:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, an error occurred. Please try again or rephrase your question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "Where can I get coffee near campus?",
    "Best restaurants within walking distance",
    "Find grocery stores near UC Merced",
    "Where's the nearest gym or fitness center?",
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="bg-blue-600 px-6 py-4 border-b border-blue-700">
        <h2 className="text-2xl font-bold text-white mb-1">Chat Assistant</h2>
        <p className="text-blue-100 text-sm">
          Ask me anything about places near UC Merced
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-blue-600 font-bold">UC</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Welcome to UCM Transit Assistant!
              </h3>
              <p className="text-gray-600 text-lg max-w-md">
                I&apos;ll help you find places near campus and show you the best
                bus route to get there.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 max-w-lg shadow-sm">
              <p className="text-blue-600 font-semibold mb-3 text-center">
                Try asking:
              </p>
              <div className="space-y-2">
                {exampleQueries.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(example)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg text-gray-700 text-sm transition-all border border-gray-200 hover:border-blue-300"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <p className="font-bold text-sm mb-2">
                  {msg.role === "user" ? "You" : "Assistant"}
                </p>
                <div
                  className={`prose prose-sm max-w-none ${
                    msg.role === "user" ? "prose-invert" : ""
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 max-w-[85%]">
              <p className="font-bold text-sm mb-2">Assistant</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-300 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about restaurants, shops, activities near UC Merced..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
