import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, MessageCircle, Bot, ChevronUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  response?: string;
  error?: string;
  remainingRequests?: number;
}

export function TalkToUs() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number>(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const whatsappLink = `https://wa.me/14704657028?text=${encodeURIComponent("Hi, I need support with GreenPay")}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/ai/chat', {
        messages: messages.concat(userMessage).map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      const data: ChatResponse = await response.json();

      if (data.remainingRequests !== undefined) {
        setRemainingRequests(data.remainingRequests);
      }

      const replyContent = response.ok
        ? (data.response || '')
        : (data.error || 'Unable to process your request. Please try again later.');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openAI = () => {
    setMenuOpen(false);
    setAiOpen(true);
  };

  return (
    <>
      {/* AI Chat Window */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-28 right-4 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700"
            style={{ height: '380px' }}
          >
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-base">Ask AI</h3>
                <p className="text-xs text-emerald-100">Get help with GreenPay</p>
                <p className="text-xs text-emerald-50 mt-0.5">
                  {remainingRequests} request{remainingRequests !== 1 ? 's' : ''} remaining today
                </p>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="p-1 hover:bg-green-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">👋 Hello! How can I help you today?</p>
                  <p className="text-xs mt-2 text-gray-400">Ask about payments, transfers, cards, or any feature</p>
                </div>
              )}
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-green-500 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t dark:border-gray-700 p-3 flex flex-col gap-2 rounded-b-2xl bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your question..."
                  className="text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 flex-shrink-0"
                >
                  Send
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">Powered by Gemini</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up menu options */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-28 right-4 z-50 flex flex-col gap-3 items-end"
          >
            {/* AI option */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              onClick={openAI}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
            >
              <span className="text-sm font-medium">Ask AI</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </motion.button>

            {/* WhatsApp option */}
            <motion.a
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.0 }}
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
            >
              <span className="text-sm font-medium">WhatsApp</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main "Talk to Us" button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => {
          if (aiOpen) {
            setAiOpen(false);
            setMenuOpen(false);
          } else {
            setMenuOpen(prev => !prev);
          }
        }}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
      >
        <motion.div
          animate={{ rotate: menuOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp className="w-4 h-4" />
        </motion.div>
        <span className="text-sm font-semibold">Talk to us</span>
        <MessageCircle className="w-4 h-4" />
      </motion.button>
    </>
  );
}
