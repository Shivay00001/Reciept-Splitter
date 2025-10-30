
export interface ReceiptItem {
  name: string;
  price: number;
}

export interface ParsedReceipt {
  items: ReceiptItem[];
  tax: number;
  total: number;
}

export interface Assignments {
  [itemName: string]: string[];
}

export interface PersonTotal {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

export interface PeopleTotals {
  [personName: string]: PersonTotal;
}

export interface PaymentStatus {
  [personName: string]: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'bot' | 'system';
  text: string;
}