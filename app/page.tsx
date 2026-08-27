'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Image as ImageIcon, X, Loader2, Clipboard, Flame, LogIn } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// I have added your Render URL here:
const SOCKET_URL = 'https://hotdrop-backend.onrender.com';

type ClipboardItem = {
  id: string;
  type: 'text' | 'image';
  content: string;
  timestamp: number;
};

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected
  const [isDragging, setIsDragging] = useState(false);

  // 1. Initialize Socket & Room on Load
  useEffect(() => {
    // Generate a random room code if one doesn't exist
    const initialRoom = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(initialRoom);

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('Connected to Switchboard');
      newSocket.emit('join-room', initialRoom);
    });

    newSocket.on('init-history', (history: ClipboardItem[]) => {
      setItems(history);
    });

    newSocket.on('new-item', (item: ClipboardItem) => {
      setItems(prev => [item, ...prev].slice(0, 5));
    });

    newSocket.on('sync-list', (updatedList: ClipboardItem[]) => {
      setItems(updatedList);
    });

    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));

    return () => {
      newSocket.close();
    };
  }, []);

  // 2. Handle Changing Rooms (Joining)
  const joinRoom = (code: string) => {
    const cleanCode = code.toUpperCase().trim();
    if (cleanCode.length > 0 && socket) {
      setRoomCode(cleanCode);
      socket.emit('join-room', cleanCode);
      setIsEditingRoom(false);
      setItems([]); // Clear local view while loading new room
    }
  };

  // 3. Handle Pasting / Uploading
  const uploadFile = (file: File) => {
    if (!socket || connectionStatus !== 'connected') return;

    if (!file.type.startsWith('image/')) {
      alert("Only images are supported for drop/upload right now.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large! Please keep it under 5MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const newItem: ClipboardItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'image',
        content: event.target?.result as string,
        timestamp: Date.now(),
      };
      socket.emit('upload-item', { roomCode, item: newItem });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!socket || connectionStatus !== 'connected') return;

    const text = e.clipboardData.getData('text');
    const files = e.clipboardData.files;

    if (files && files.length > 0) {
      uploadFile(files[0]);
    } else if (text) {
      const newItem: ClipboardItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'text',
        content: text,
        timestamp: Date.now(),
      };
      socket.emit('upload-item', { roomCode, item: newItem });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const deleteItem = (id: string) => {
    if (socket) socket.emit('delete-item', { roomCode, itemId: id });
  };

  const clearAll = () => {
    if (socket && confirm('Clear history for everyone in this room?')) {
      socket.emit('clear-all', roomCode);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fffcf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-100 dark:selection:bg-orange-900/50 relative"
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-orange-500/10 dark:bg-orange-500/20 backdrop-blur-sm border-4 border-dashed border-orange-500 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
              <ImageIcon size={40} className="text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Drop Image Here</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Release to instantly share to room {roomCode}</p>
          </div>
        </div>
      )}

      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-orange-50 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] rounded-full bg-amber-50 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-orange-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Flame size={24} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Hotdrop</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {connectionStatus === 'connected' ? 'Online' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Room Switcher */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 pl-4 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room:</span>
            {isEditingRoom ? (
              <form 
                onSubmit={(e) => { e.preventDefault(); joinRoom(roomCode); }}
                className="flex items-center"
              >
                <input 
                  autoFocus
                  type="text" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onBlur={() => joinRoom(roomCode)}
                  className="w-20 font-mono font-bold text-slate-800 bg-transparent outline-none uppercase placeholder-slate-300"
                  maxLength={6}
                />
              </form>
            ) : (
              <button 
                onClick={() => setIsEditingRoom(true)}
                className="font-mono font-bold text-slate-800 hover:text-orange-500 transition-colors uppercase"
              >
                {roomCode}
              </button>
            )}
            <button 
               onClick={() => setIsEditingRoom(!isEditingRoom)}
               className="p-2 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition-colors"
               title="Join a different room"
            >
              <LogIn size={16} />
            </button>
          </div>

          <button 
            onClick={clearAll}
            className="hidden md:flex p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100"
            title="Clear All"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* Drop Zone */}
        <div className="group relative mb-12 cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-25 transition duration-500"></div>
          <div className="relative bg-white border-2 border-dashed border-orange-100 rounded-[2.2rem] p-12 md:p-16 flex flex-col items-center justify-center transition-all shadow-sm group-hover:border-orange-300">
            {isUploading ? (
              <div className="py-4 flex flex-col items-center">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
                <p className="text-sm font-bold text-orange-600 uppercase tracking-tighter">Syncing to Cloud...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <Clipboard size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center">Paste, Drop, or Tap</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium text-center mt-2 px-4">
                  Images & text sync to Room <span className="text-orange-500 dark:text-orange-400 font-mono font-bold">{roomCode}</span>
                </p>
              </>
            )}
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadFile(e.target.files[0]);
                  e.target.value = ''; // Reset input to allow same file upload again
                }
              }}
            />
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