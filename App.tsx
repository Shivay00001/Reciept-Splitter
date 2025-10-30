
import React, { useState, useEffect, useCallback } from 'react';
import ReceiptPane from './components/ReceiptPane';
import ChatPane from './components/ChatPane';
import type { ParsedReceipt, Assignments, PeopleTotals, ChatMessage, PaymentStatus } from './types';
import { parseReceipt, processChatCommand } from './services/geminiService';

const App: React.FC = () => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [peopleTotals, setPeopleTotals] = useState<PeopleTotals>({});
  const [tipPercentage, setTipPercentage] = useState<number>(18);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Hello! Upload a receipt, then tell me who had what. E.g., 'Sarah and I shared the pizza'. You can then settle up using the 'Pay' button. (Note: Payments are simulated)." }
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingChat, setIsProcessingChat] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // remove data:mime/type;base64, part
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setParsedReceipt(null);
    setAssignments({});
    setPaymentStatus({});
    
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    try {
      const base64Image = await fileToBase64(file);
      const receiptData = await parseReceipt(base64Image, file.type);
      setParsedReceipt(receiptData);
      
      const initialAssignments: Assignments = {};
      receiptData.items.forEach(item => {
        initialAssignments[item.name] = [];
      });
      setAssignments(initialAssignments);

      setChatMessages(prev => [...prev, { sender: 'system', text: `Receipt processed with ${receiptData.items.length} items.`}]);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setChatMessages(prev => [...prev, { sender: 'bot', text: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!parsedReceipt) return;

    setIsProcessingChat(true);
    setError(null);
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);

    try {
      const newAssignments = await processChatCommand(parsedReceipt.items, assignments, message);
      setAssignments(newAssignments);
    } catch (err: any) {
      setError(err.message);
      setChatMessages(prev => [...prev, { sender: 'bot', text: `Sorry, I had trouble with that. ${err.message}` }]);
    } finally {
      setIsProcessingChat(false);
    }
  };
  
  const handleMarkAsPaid = (person: string) => {
    setPaymentStatus(prevStatus => ({
      ...prevStatus,
      [person]: true,
    }));
    setChatMessages(prev => [...prev, { sender: 'system', text: `${person} has paid their share.` }]);
  };

  const calculateTotals = useCallback(() => {
    if (!parsedReceipt) return;

    const newPeopleTotals: { [key: string]: { subtotal: number } } = {};
    let assignedItemsSubtotal = 0;

    Object.entries(assignments).forEach(([itemName, people]) => {
      const peopleList = people as string[];
      if (peopleList.length > 0) {
        const item = parsedReceipt.items.find(i => i.name === itemName);
        if (item) {
          const pricePerPerson = item.price / peopleList.length;
          assignedItemsSubtotal += item.price;
          peopleList.forEach(person => {
            if (!newPeopleTotals[person]) {
              newPeopleTotals[person] = { subtotal: 0 };
            }
            newPeopleTotals[person].subtotal += pricePerPerson;
          });
        }
      }
    });

    const tax = parsedReceipt.tax || 0;
    const subtotalFromReceipt = parsedReceipt.items.reduce((acc, item) => acc + item.price, 0);
    const tipAmount = subtotalFromReceipt * (tipPercentage / 100);

    const finalTotals: PeopleTotals = {};
    const peopleWithAssignments = Object.keys(newPeopleTotals);
    
    // Calculate total proportional subtotal for tax/tip distribution
    const totalAssignedSubtotal = peopleWithAssignments.reduce((acc, person) => acc + newPeopleTotals[person].subtotal, 0);

    peopleWithAssignments.forEach((person) => {
      const data = newPeopleTotals[person];
      // Distribute tax and tip based on each person's share of the *assigned* subtotal
      const proportion = totalAssignedSubtotal > 0 ? data.subtotal / totalAssignedSubtotal : 0;
      const personTax = tax * proportion;
      const personTip = tipAmount * proportion;
      finalTotals[person] = {
        subtotal: data.subtotal,
        tax: personTax,
        tip: personTip,
        total: data.subtotal + personTax + personTip,
      };
    });

    setPeopleTotals(finalTotals);
  }, [parsedReceipt, assignments, tipPercentage]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 overflow-hidden">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold font-orbitron text-cyan-300 text-shadow-neon-cyan drop-shadow-lg">
          AI Bill Splitter
        </h1>
        <p className="mt-2 text-lg text-cyan-400/80">
          Snap a receipt, chat to split, and settle up in seconds.
        </p>
      </header>
      <main className="max-w-7xl mx-auto" style={{ perspective: '1500px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
          <ReceiptPane
            onImageUpload={handleImageUpload}
            parsedReceipt={parsedReceipt}
            assignments={assignments}
            isLoading={isLoading}
            tipPercentage={tipPercentage}
            setTipPercentage={setTipPercentage}
            imagePreviewUrl={imagePreviewUrl}
          />
          <ChatPane
            onSendMessage={handleSendMessage}
            peopleTotals={peopleTotals}
            chatMessages={chatMessages}
            isLoading={isProcessingChat}
            paymentStatus={paymentStatus}
            onMarkAsPaid={handleMarkAsPaid}
          />
        </div>
        {error && <div className="mt-6 text-center p-3 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg animate-fade-in-up">{error}</div>}
      </main>
    </div>
  );
};

export default App;
