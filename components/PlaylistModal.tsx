import React, { useRef, useState, useCallback } from 'react';
import { Track } from '../types';
import { LinkIcon } from './Icons';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrackId: string;
  onTrackSelect: (track: Track) => void;
  onAddFiles?: (files: File[] | FileList) => void;
  onAddUrl?: (url: string) => void;
  onClearPlaylist?: () => void;
}

const PlaylistModal = React.memo<PlaylistModalProps>(({ 
  isOpen, 
  onClose, 
  tracks, 
  currentTrackId, 
  onTrackSelect,
  onAddFiles,
  onAddUrl,
  onClearPlaylist
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dragCounter = useRef(0);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && onAddUrl) {
      onAddUrl(urlInput.trim());
      setUrlInput('');
      onClose();
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const scanFileEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => entry.file(resolve));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readAllEntries = async () => {
        let allEntries: any[] = [];
        let results = await new Promise<any[]>((resolve) => reader.readEntries(resolve));
        while (results.length > 0) {
          allEntries = allEntries.concat(results);
          results = await new Promise<any[]>((resolve) => reader.readEntries(resolve));
        }
        return allEntries;
      };
      const entries = await readAllEntries();
      const files = await Promise.all(entries.map(e => scanFileEntry(e)));
      return files.flat();
    }
    return [];
  };

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    if (e.dataTransfer.items && onAddFiles) {
      setIsProcessing(true);
      const items = Array.from(e.dataTransfer.items);
      const filePromises = items.map((item: any) => {
        const entry = item.webkitGetAsEntry();
        return entry ? scanFileEntry(entry) : null;
      }).filter(p => p !== null);
      
      const fileArrays = await Promise.all(filePromises);
      const allFiles = fileArrays.flat();
      if (allFiles.length > 0) {
        onAddFiles(allFiles);
      }
      setIsProcessing(false);
    }
  }, [onAddFiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div 
        className={`relative w-full max-w-md max-h-[80vh] overflow-hidden glass-dark rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-500 border transition-all duration-300 ${
          isDraggingOver ? 'border-rose-500 scale-[1.02] bg-rose-500/5' : 'border-white/5'
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {(isDraggingOver || isProcessing) && (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-rose-600/20 backdrop-blur-md transition-opacity duration-300 pointer-events-none opacity-100`}>
            <div className={`w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-rose-500/30 ${isProcessing ? 'animate-spin' : ''}`}>
              <span className="text-4xl">{isProcessing ? '⏳' : '💦'}</span>
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-white">
              {isProcessing ? 'Swallowing everything...' : 'Lepasin cairannmu di dalam sini...'}
            </p>
          </div>
        )}
        
        <div className="px-6 pt-6 pb-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter leading-none">LIBRARY</h2>
              <p className="text-[7px] text-rose-500/60 font-black uppercase tracking-[0.3em] mt-1">{tracks.length} VOLUMES</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tracks.length > 0 && onClearPlaylist && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClearPlaylist(); }}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-rose-500/20 transition-all active:scale-90"
              >
                Clear
              </button>
            )}
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/40 transition-all border border-white/5 text-[10px]"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1.5 custom-scrollbar">
          {tracks.length > 0 ? (
            tracks.map((track) => (
              <button
                key={track.id}
                onClick={() => { onTrackSelect(track); onClose(); }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300 group border ${
                  currentTrackId === track.id 
                    ? 'bg-rose-600/10 border-rose-500/20 shadow-xl' 
                    : 'hover:bg-white/5 border-transparent'
                }`}
              >
                <div className="relative shrink-0 overflow-hidden rounded-xl border border-white/5 w-14 h-9 bg-black">
                  <img src={track.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                  {currentTrackId === track.id && (
                    <div className="absolute inset-0 bg-rose-600/20 flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className={`font-black text-[11px] truncate leading-tight ${currentTrackId === track.id ? 'text-rose-400' : 'text-white/80 group-hover:text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-[7px] font-black text-white/20 tracking-widest truncate uppercase mt-0.5">
                    {track.artist}
                  </p>
                </div>

                {currentTrackId === track.id && (
                  <div className="flex gap-0.5 items-end h-2.5 mr-1">
                    {[0, 1, 2].map(i => (
                      <div 
                        key={i} 
                        className="w-0.5 bg-rose-500 rounded-full" 
                        style={{ height: `${50 + i * 25}%` }} 
                      />
                    ))}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-4 opacity-10">🔞</span>
              <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em]">Deeply Empty</p>
              <p className="text-white/10 text-[6px] uppercase tracking-widest mt-2">Drag files or folders to fill me</p>
            </div>
          )}
        </div>

        <div className="p-5 bg-black/20 border-t border-white/5 space-y-3 shrink-0">
          <form onSubmit={handleUrlSubmit} className="relative group/form">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/form:text-rose-500 transition-colors">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <input 
              type="text" 
              placeholder="Inject Stream URL..." 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-10 pr-16 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white focus:outline-none focus:border-rose-500/50 focus:bg-rose-500/5 transition-all placeholder:text-white/10"
            />
            <button 
              type="submit"
              disabled={!urlInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-10 text-white text-[8px] font-black uppercase tracking-wider rounded-lg transition-all shadow-lg active:scale-90"
            >
              Add
            </button>
          </form>

          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onAddFiles?.(e.target.files)} accept="video/*,audio/*" multiple className="hidden" />
          <input 
            type="file" 
            ref={folderInputRef} 
            onChange={(e) => e.target.files && onAddFiles?.(e.target.files)} 
            multiple 
            className="hidden" 
            {...({ webkitdirectory: "true", directory: "true" } as any)} 
          />
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-3.5 bg-white text-black hover:bg-rose-600 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:scale-125 transition-transform">📄</span>
              <span className="truncate">Files</span>
            </button>
            <button 
              onClick={() => folderInputRef.current?.click()}
              className="py-3.5 bg-rose-600 text-white hover:bg-rose-500 font-black text-[9px] uppercase tracking-[0.3em] rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:scale-125 transition-transform">📂</span>
              <span className="truncate">Folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PlaylistModal;