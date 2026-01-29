'use client';

import React, { useState } from 'react';
import { Trash2, Copy, Image as ImageIcon, X, Loader2, Clipboard } from 'lucide-react';

type ClipboardItem = {
  id: string;
  type: 'text' | 'image';
  content: string;
  timestamp: number;
};

export default function Home() {
  const [roomCode] = useState('BIRD-42'); // We will make this dynamic later
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle Text and Image Pastes
  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const files = e.clipboardData.files;

    if (files && files.length > 0) {
      setIsUploading(true);
      const file = files[0];
      
      // Limit to 15MB
      if (file.size > 15 * 1024 * 1024) {
        alert("File too large! Keep it under 15MB.");
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: ClipboardItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          content: event.target?.result as string,
          timestamp: Date.now(),
        };
        setItems(prev => [newItem, ...prev].slice(0, 5));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } else if (text) {
      const newItem: ClipboardItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        content: text,
        timestamp: Date.now(),
      };
      setItems(prev => [newItem, ...prev].slice(0, 5));
    }
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex justify-center" onPaste={handlePaste}>
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Private Room</p>
            <p className="text-xl font-mono font-black text-indigo-600 tracking-tighter">{roomCode}</p>
          </div>
          <button 
            onClick={() => setItems([])}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Clear All"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* Big Paste Target */}
        <div className="relative group border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-default mb-10 shadow-sm">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
              <p className="text-slate-500 font-medium animate-pulse">Processing image...</p>
            </div>
          ) : (
            <>
              <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                <Clipboard size={32} />
              </div>
              <p className="text-xl font-semibold text-slate-700">Paste anything</p>
              <p className="text-sm text-slate-400 mt-1">Images or text • Max 15MB</p>
            </>
          )}
        </div>

        {/* History List */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-1 overflow-hidden">
                {item.type === 'text' ? (
                  <p className="text-slate-700 whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</p>
                ) : (
                  <img src={item.content} alt="Pasted" className="rounded-xl max-h-80 w-auto object-contain border border-slate-100" />
                )}
                <div className="mt-3 flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-300 uppercase">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => deleteItem(item.id)}
                className="self-start p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          
          {items.length === 0 && !isUploading && (
            <p className="text-center text-slate-300 text-sm mt-10">Your temporary history is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}