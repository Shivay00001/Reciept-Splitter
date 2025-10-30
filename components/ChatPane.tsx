
import React, { useState, useRef, useEffect } from 'react';
import type { PeopleTotals, ChatMessage, PaymentStatus } from '../types';
import { SendIcon, UserIcon, BotIcon, CheckCircleIcon } from './Icons';
import Spinner from './Spinner';

interface ChatPaneProps {
  onSendMessage: (message: string) => void;
  peopleTotals: PeopleTotals;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  paymentStatus: PaymentStatus;
  onMarkAsPaid: (person: string) => void;
}

const ChatPane: React.FC<ChatPaneProps> = ({
  onSendMessage,
  peopleTotals,
  chatMessages,
  isLoading,
  paymentStatus,
  onMarkAsPaid,
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const people = Object.keys(peopleTotals);

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md shadow-neon-indigo rounded-2xl border border-indigo-500/30 transition-all duration-500 transform hover:border-indigo-500/80" style={{ transform: 'rotateY(3deg)' }}>
      <div className="p-6 border-b border-indigo-500/20">
        <h2 className="text-2xl font-bold font-orbitron text-indigo-300 text-shadow-neon-indigo">SMART_SPLIT</h2>
        <p className="text-sm text-indigo-400/80">Assign items via natural language.</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Chat Area */}
        <div className="flex flex-col flex-1 p-6 overflow-y-auto">
           <div className="flex-grow space-y-4">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 animate-fade-in-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender !== 'user' && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'bot' ? 'bg-black/30 border border-pink-500/50' : 'bg-transparent'}`}>
                    {msg.sender === 'bot' && <BotIcon className="w-5 h-5 text-pink-400"/>}
                  </div>}
                  <div className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md border ${
                      msg.sender === 'user'
                        ? 'bg-indigo-500/20 text-indigo-200 rounded-br-none border-indigo-500/50'
                        : msg.sender === 'bot' 
                        ? 'bg-pink-500/20 text-pink-200 rounded-bl-none border-pink-500/50'
                        : 'text-center w-full text-xs text-cyan-400/70 border-none'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                  </div>
                   {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50"><UserIcon className="w-5 h-5 text-indigo-300"/></div>}
                </div>
              ))}
               <div ref={chatEndRef} />
           </div>
           <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Dhruv had the nachos"
              className="flex-grow p-3 bg-black/30 border-b-2 border-indigo-500/50 rounded-full focus:outline-none focus:ring-0 focus:border-indigo-400 focus:bg-black/50 text-indigo-200 transition-all duration-300"
              disabled={isLoading || people.length === 0}
            />
            <button
              type="submit"
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:bg-indigo-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-400 transition-all duration-300 hover:scale-110 shadow-neon-indigo disabled:shadow-none disabled:scale-100"
              disabled={isLoading || !input.trim() || people.length === 0}
            >
              {isLoading ? <Spinner/> : <SendIcon className="w-6 h-6" />}
            </button>
          </form>
        </div>

        {/* Totals Summary Area */}
        <div className="md:w-64 lg:w-72 p-6 border-t md:border-t-0 md:border-l border-indigo-500/20 bg-black/20 overflow-y-auto">
          <h3 className="text-lg font-semibold text-indigo-200 mb-4 font-orbitron">SUMMARY</h3>
          {people.length === 0 ? (
            <p className="text-sm text-center text-indigo-400/60 py-8">Awaiting assignments...</p>
          ) : (
            <ul className="space-y-4">
              {people.map((person) => {
                  const total = peopleTotals[person].total;
                  const isPaid = paymentStatus[person] || false;

                  return (
                    <li key={person} className={`p-3 rounded-lg transition-all duration-300 border ${isPaid ? 'bg-green-900/20 border-green-500/80 shadow-neon-green' : 'bg-gray-900/30 border-gray-600/50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-100">{person}</span>
                        {isPaid ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-shadow-neon-green">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="font-semibold text-sm">PAID</span>
                          </div>
                        ) : (
                          <span className="font-mono text-lg font-bold text-indigo-300 text-shadow-neon-indigo">${total.toFixed(2)}</span>
                        )}
                      </div>
                      <div className={`text-xs space-y-1 font-mono text-gray-400 transition-opacity ${isPaid ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between"><span>Subtotal:</span> <span>${peopleTotals[person].subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tax:</span> <span>${peopleTotals[person].tax.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tip:</span> <span>${peopleTotals[person].tip.toFixed(2)}</span></div>
                      </div>
                      {!isPaid && total > 0 && (
                        <button
                          onClick={() => onMarkAsPaid(person)}
                          className="mt-3 w-full text-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-500 transition-all duration-300 shadow-neon-indigo hover:scale-105 disabled:bg-gray-600 disabled:shadow-none"
                          disabled={isLoading}
                        >
                          Pay ${total.toFixed(2)}
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPane;
