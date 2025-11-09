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
          content: "Sorry, an error occurred. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-2xl font-bold mb-4">CatTracker</h2>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">
            Ask me about places near UC Merced!
            <p className="text-sm mt-2">
              Try: &quot;What are good coffee shops nearby?&quot;
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
              }`}
            >
              <p className="font-semibold mb-1">
                {msg.role === "user" ? "You" : "Assistant"}
              </p>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-gray-100 mr-8 p-3 rounded-lg">
            <p className="font-semibold mb-1">Assistant</p>
            <p className="text-gray-500">Thinking...</p>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about places near UC Merced..."
          disabled={isLoading}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
