
import React, { useRef } from 'react';
import type { ParsedReceipt, Assignments } from '../types';
import { UploadIcon } from './Icons';
import Spinner from './Spinner';

interface ReceiptPaneProps {
  onImageUpload: (file: File) => void;
  parsedReceipt: ParsedReceipt | null;
  assignments: Assignments;
  isLoading: boolean;
  tipPercentage: number;
  setTipPercentage: (value: number) => void;
  imagePreviewUrl: string | null;
}

const ReceiptPane: React.FC<ReceiptPaneProps> = ({
  onImageUpload,
  parsedReceipt,
  assignments,
  isLoading,
  tipPercentage,
  setTipPercentage,
  imagePreviewUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const getSubtotal = () => {
    if (!parsedReceipt) return 0;
    return parsedReceipt.items.reduce((sum, item) => sum + item.price, 0);
  };
  
  const subtotal = getSubtotal();
  const tax = parsedReceipt?.tax ?? 0;
  const tipAmount = subtotal * (tipPercentage / 100);
  const total = subtotal + tax + tipAmount;

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md shadow-neon-cyan rounded-2xl border border-cyan-500/30 transition-all duration-500 transform hover:border-cyan-500/80" style={{ transform: 'rotateY(-3deg)' }}>
      <div className="p-6 border-b border-cyan-500/20">
        <h2 className="text-2xl font-bold font-orbitron text-cyan-300 text-shadow-neon-cyan">RECEIPT_SCAN</h2>
        <p className="text-sm text-cyan-500/80">Upload an image to initialize the process.</p>
      </div>

      <div className="flex-grow p-6 overflow-y-auto">
        {!parsedReceipt && !isLoading && (
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-cyan-500/50 rounded-lg cursor-pointer hover:bg-cyan-500/10 hover:border-cyan-500 transition-all duration-300 animate-pulse-glow"
          >
            <UploadIcon className="w-12 h-12 text-cyan-400" style={{ filter: 'drop-shadow(0 0 5px currentColor)'}} />
            <p className="mt-2 text-sm text-cyan-300">
              <span className="font-semibold">INITIATE UPLOAD</span> or drag & drop
            </p>
            <p className="text-xs text-cyan-500/70">.PNG, .JPG, or .WEBP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-lg text-cyan-300 font-orbitron">ANALYZING RECEIPT...</p>
              <p className="text-sm text-cyan-500/80">Parsing data from image stream.</p>
            </div>
          </div>
        )}

        {parsedReceipt && (
          <div className="animate-fade-in-up">
            {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt="Receipt preview" className="rounded-lg mb-6 max-h-48 w-full object-contain border border-cyan-500/20" />
            )}
            <h3 className="text-lg font-semibold mb-4 text-cyan-200 font-orbitron">ITEMIZED_BILL</h3>
            <ul className="space-y-3">
              {parsedReceipt.items.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/20 transition-all duration-300 hover:bg-cyan-500/20 hover:-translate-y-1 hover:border-cyan-500/50">
                  <div>
                    <p className="font-medium text-gray-100">{item.name}</p>
                    <p className="text-xs text-cyan-400">
                      {assignments[item.name]?.join(', ') || 'UNASSIGNED'}
                    </p>
                  </div>
                  <p className="font-mono text-cyan-300">${item.price.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {parsedReceipt && (
        <div className="p-6 border-t border-cyan-500/20 bg-black/30">
           <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-center text-gray-300">
                    <div className='flex items-center gap-2'>
                        <span>Tip</span>
                        <select 
                            value={tipPercentage} 
                            onChange={(e) => setTipPercentage(Number(e.target.value))}
                            className="bg-black/50 border border-cyan-500/30 text-cyan-300 rounded p-0.5 text-xs focus:ring-cyan-500 focus:border-cyan-400 focus:bg-cyan-900/50"
                        >
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="18">18%</option>
                            <option value="20">20%</option>
                            <option value="25">25%</option>
                        </select>
                    </div>
                    <span>${tipAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-cyan-300 pt-2 border-t border-cyan-500/20 mt-2 text-shadow-neon-cyan">
                    <span>TOTAL</span>
                    <span>${total.toFixed(2)}</span>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptPane;
