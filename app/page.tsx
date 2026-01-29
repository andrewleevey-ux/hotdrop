'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Image as ImageIcon, X, Loader2, Clipboard, Flame } from 'lucide-react';

type ClipboardItem = {
  id: string;
  type: 'text' | 'image';
  content: string;
  timestamp: number;
};

export default function Home() {
  const [roomCode] = useState('HOT-77'); // We will make this dynamic in the next step
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const files = e.clipboardData.files;

    if (files && files.length > 0) {
      setIsUploading(true);
      const file = files[0];

      if (file.size > 15 * 1024 * 1024) {
        alert("File too large! Max 15MB for now.");
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: ClipboardItem = {
          id: Math.random().toString(36).substring(2, 9),
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
        id: Math.random().toString(36).substring(2, 9),
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
    <div className="min-h-screen bg-[#fffcf9] text-slate-900 font-sans selection:bg-orange-100" onPaste={handlePaste}>
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-orange-50 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] rounded-full bg-amber-50 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-orange-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Flame size={22} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Hotdrop</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Room: {roomCode}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setItems([])}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* Drop Zone */}
        <div className="group relative mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-25 transition duration-500"></div>
          <div className="relative bg-white border-2 border-dashed border-orange-100 rounded-[2.2rem] p-16 flex flex-col items-center justify-center transition-all shadow-sm group-hover:border-orange-300">
            {isUploading ? (
              <div className="py-4 flex flex-col items-center">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
                <p className="text-sm font-bold text-orange-600 uppercase tracking-tighter">Uploading to Cloud...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <Clipboard size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Paste or Drop</h2>
                <p className="text-sm text-slate-400 font-medium">Synced across all your devices instantly</p>
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session History</h3>
            <span className="text-[10px] font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">{items.length} / 5</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {item.type === 'text' ? (
                    <p className="text-slate-600 text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium">{item.content}</p>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-50 bg-slate-50">
                      <img src={item.content} alt="Pasted" className="max-h-[400px] w-full object-contain" />
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-300 uppercase">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="h-[1px] flex-1 bg-slate-50" />
                  </div>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && !isUploading && (
            <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-[2rem] bg-white/30">
              <p className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">Waiting for your first drop...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}