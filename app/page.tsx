'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Image as ImageIcon, X, Loader2, Clipboard, Flame, LogIn, Send, ArchiveX, ClipboardPaste } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'react-qr-code';

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
  const [textInput, setTextInput] = useState('');

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

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!socket || connectionStatus !== 'connected' || !textInput.trim()) return;

    const newItem: ClipboardItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'text',
      content: textInput.trim(),
      timestamp: Date.now(),
    };
    socket.emit('upload-item', { roomCode, item: newItem });
    setTextInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: Could add a small toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const clearAll = () => {
    if (socket && confirm('Clear history for everyone in this room?')) {
      socket.emit('clear-all', roomCode);
    }
  };

  const roomUrl = `https://hotdrop.boringapps.co.uk/${roomCode}`;

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
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-orange-50 dark:bg-orange-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] rounded-full bg-amber-50 dark:bg-amber-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 py-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center py-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none">
              <Flame size={24} className="text-white fill-current" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">Hotdrop</h1>
          </div>
        </div>

        {/* Unified Composer */}
        <div className="mb-8 relative bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm transition-all focus-within:border-orange-200 dark:focus-within:border-orange-500/50 group overflow-hidden">

          {/* Integrated Room Status Bar */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Left: Status */}
            <div className="flex items-center gap-2 pl-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {connectionStatus === 'connected' ? 'Online' : 'Reconnecting...'}
              </span>
            </div>

            {/* Right: Room Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 pl-3 shadow-sm">
                <div className="hidden sm:block items-center justify-center p-0.5 bg-white rounded mr-1">
                  <QRCode value={roomUrl} size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Room:</span>
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
                      className="w-16 font-mono text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none uppercase placeholder-slate-300 dark:placeholder-slate-600"
                      maxLength={6}
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setIsEditingRoom(true)}
                    className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors uppercase"
                  >
                    {roomCode}
                  </button>
                )}
                <button
                   onClick={() => setIsEditingRoom(!isEditingRoom)}
                   className="p-1 text-slate-400 hover:text-slate-200 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                   title="Join a different room"
                >
                  <LogIn size={16} />
                </button>
              </div>

              <button 
                onClick={clearAll}
                className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                title="Clear All"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-orange-500 mb-2" size={24} />
              <p className="text-xs font-bold text-orange-600 uppercase tracking-tighter">Syncing...</p>
            </div>
          )}
          <form onSubmit={handleTextSubmit} className="flex flex-col relative z-0">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type, paste, or drop here to share... (Enter to send)"
              className="w-full bg-transparent p-5 min-h-[120px] resize-y text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none text-base leading-relaxed"
            />
            <div className="flex items-center justify-between p-3 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 rounded-b-3xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                  title="Upload Image"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setTextInput(prev => prev + text);
                    } catch (e) {
                      alert('Please use Ctrl+V or Cmd+V to paste');
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                  title="Paste from Clipboard"
                >
                  <ClipboardPaste size={20} />
                </button>
              </div>
              <button
                type="submit"
                disabled={!textInput.trim() || connectionStatus !== 'connected'}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-colors disabled:cursor-not-allowed shadow-md shadow-orange-200 dark:shadow-none flex items-center gap-2 font-bold text-sm"
                title="Send Text"
              >
                <span>Send</span>
                <Send size={16} />
              </button>
            </div>
          </form>
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

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session History</h3>
            <span className="text-[10px] font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">{items.length} / 5</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {item.type === 'text' ? (
                    <div className="relative">
                      <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium pr-10">{item.content}</p>
                      <button
                        onClick={() => copyToClipboard(item.content)}
                        className="absolute top-0 right-0 p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <img src={item.content} alt="Pasted" className="max-h-[400px] w-full object-contain" />
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="h-[1px] flex-1 bg-slate-50 dark:bg-slate-800" />
                  </div>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && !isUploading && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <ArchiveX className="text-slate-200 dark:text-slate-800 mb-4" size={48} />
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No drops in this room yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}