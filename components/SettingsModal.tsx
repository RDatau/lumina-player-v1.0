import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';
import { InternalAudioTrack } from '../App';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  audioTracks: InternalAudioTrack[];
  selectedTrackId: string;
  onTrackChange: (id: string) => void;
  onLoadExternalAudio: (file: File) => void;
}

const CustomDropdown: React.FC<{ 
    options: { id: string, label: string }[], 
    value: string, 
    onChange: (id: string) => void 
}> = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value) || options[0];

    return (
        <div ref={dropdownRef} className="relative w-full">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-white/90 text-left focus:outline-none focus:border-rose-500/50 flex justify-between items-center transition-all hover:bg-white/[0.08]"
            >
                <span className="truncate">{selectedOption?.label || 'Select Track...'}</span>
                <span className={`text-[8px] transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : 'text-white/20'}`}>▼</span>
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 glass-dark border border-white/10 rounded-2xl py-2 z-[100] shadow-[0_20px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-2 duration-300 max-h-48 overflow-y-auto custom-scrollbar">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => { onChange(opt.id); setIsOpen(false); }}
                            className={`w-full px-5 py-3 text-[10px] font-bold text-left transition-all hover:bg-white/5 ${value === opt.id ? 'text-rose-400 bg-rose-500/5' : 'text-white/60 hover:text-white'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ShortcutRow = ({ keyName, desc }: { keyName: string, desc: string }) => (
  <div className="flex justify-between items-center py-2 px-1 border-b border-white/5 last:border-0 group select-none">
    <span className="text-[10px] font-bold text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-widest">{desc}</span>
    <span className="px-2 py-0.5 glass rounded-md text-[9px] font-black text-rose-500 border border-rose-500/20">{keyName}</span>
  </div>
);

const SettingsModal = React.memo<SettingsModalProps>(({ 
    isOpen, 
    onClose, 
    settings, 
    onSettingsChange, 
    audioTracks, 
    selectedTrackId, 
    onTrackChange,
    onLoadExternalAudio
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'video' | 'audio' | 'subtitle'>('general');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const modalRef = useRef<HTMLDivElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      setPosition({
        x: newX - (centerX - (modalRef.current?.offsetWidth || 0) / 2),
        y: newY - (centerY - (modalRef.current?.offsetHeight || 0) / 2)
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  const updateSection = (section: keyof AppSettings | 'root', key: string, value: any) => {
    if (section === 'root') {
        onSettingsChange({
            ...settings,
            [key]: value
        });
        return;
    }
    onSettingsChange({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [key]: value
      }
    });
  };

  const resetSection = (section: 'video', key: string) => {
    const defaults: any = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        gamma: 100
    };
    updateSection(section, key, defaults[key]);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 pointer-events-none animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
      
      <div 
        ref={modalRef}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
        className="relative w-full max-w-lg glass-dark rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto transition-shadow duration-300 select-none"
      >
        
        <div 
          onMouseDown={handleMouseDown}
          className="flex border-b border-white/5 bg-black/40 cursor-grab active:cursor-grabbing"
        >
          {(['general', 'video', 'audio', 'subtitle'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                activeTab === tab ? 'text-white' : 'text-white/20 hover:text-white/40'
              }`}
            >
              {tab === 'general' ? 'Umum' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-rose-600 rounded-full" />
              )}
            </button>
          ))}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-20">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/20">
          
          {activeTab === 'general' && (
            <div className="space-y-10">
                <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Basic Flow</label>
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group hover:border-rose-500/30 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-widest text-white/90">Auto Play Next</span>
                            <span className="text-[8px] font-bold text-white/20 mt-1">Suntik otomatis volume berikutnya setelah selesai</span>
                        </div>
                        <button 
                            onClick={() => updateSection('root', 'autoNext', !settings.autoNext)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.autoNext ? 'bg-rose-600' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 ${settings.autoNext ? 'right-1 shadow-lg' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Keyboard Shortcuts</label>
                    <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5 space-y-1">
                        <ShortcutRow keyName="Space" desc="Play / Pause" />
                        <ShortcutRow keyName="F" desc="Forward 1 Frame" />
                        <ShortcutRow keyName="D" desc="Backward 1 Frame" />
                        <ShortcutRow keyName="G" desc="Toggle Fullscreen" />
                        <ShortcutRow keyName="M" desc="Toggle Mute" />
                        <ShortcutRow keyName="[" desc="Set Point A" />
                        <ShortcutRow keyName="]" desc="Set Point B" />
                        <ShortcutRow keyName="\" desc="Toggle A/B Repeat" />
                        <ShortcutRow keyName="Shift + [" desc="Clear Point A" />
                        <ShortcutRow keyName="Shift + ]" desc="Clear Point B" />
                        <ShortcutRow keyName="← / →" desc="Seek 5s (Ctrl: 30s)" />
                        <ShortcutRow keyName="↑ / ↓" desc="Volume Control" />
                        <ShortcutRow keyName="Esc" desc="Stop / Clear Library" />
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                  {['Default', '16:9', '16:10', '4:3', '2:1', '1:1'].map((ratio) => (
                    <button 
                      key={ratio}
                      onClick={() => updateSection('video', 'aspectRatio', ratio)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                        settings.video.aspectRatio === ratio 
                        ? 'bg-rose-600 text-white shadow-lg scale-105' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Color Equalizer</label>
                <div className="space-y-5">
                  {[
                    { label: 'Brightness', key: 'brightness', min: 0, max: 200 },
                    { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
                    { label: 'Saturation', key: 'saturation', min: 0, max: 200 },
                    { label: 'Hue', key: 'hue', min: -180, max: 180 },
                    { label: 'Gamma', key: 'gamma', min: 0, max: 200 },
                  ].map((filter) => (
                    <div key={filter.key} className="flex items-center gap-6 group">
                      <span className="w-20 text-[9px] font-bold text-white/60 group-hover:text-white transition-colors">{filter.label}:</span>
                      <div className="flex-1 relative h-1.5 flex items-center">
                         <input 
                            type="range" 
                            min={filter.min} 
                            max={filter.max} 
                            value={(settings.video as any)[filter.key]} 
                            onChange={(e) => updateSection('video', filter.key, parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                         />
                         <div className="absolute inset-0 bg-white/5 rounded-full" />
                         <div className="absolute h-full bg-rose-500 rounded-full" style={{ width: `${((((settings.video as any)[filter.key] - filter.min) / (filter.max - filter.min)) * 100)}%` }} />
                      </div>
                      <button 
                        onClick={() => resetSection('video', filter.key)}
                        className="px-3 py-1 bg-white/5 hover:bg-rose-600 hover:text-white text-[8px] font-black uppercase rounded-lg transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                 <button 
                    onClick={() => updateSection('video', 'hardwareAcceleration', !settings.video.hardwareAcceleration)}
                    className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center transition-all ${
                        settings.video.hardwareAcceleration ? 'bg-rose-600 border-rose-500' : 'bg-transparent'
                    }`}
                 >
                    {settings.video.hardwareAcceleration && <span className="text-[10px]">✓</span>}
                 </button>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Hardware Acceleration</span>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-8">
               <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Audio Track</label>
                        <button 
                            onClick={() => audioInputRef.current?.click()}
                            className="text-[8px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                        >
                            <span>+ Inject External</span>
                        </button>
                        <input 
                            type="file" 
                            ref={audioInputRef} 
                            onChange={(e) => e.target.files?.[0] && onLoadExternalAudio(e.target.files[0])} 
                            accept="audio/*" 
                            className="hidden" 
                        />
                    </div>
                    <CustomDropdown 
                        options={audioTracks.map(t => ({ id: t.id, label: t.label }))}
                        value={selectedTrackId}
                        onChange={onTrackChange}
                    />
               </div>

               {[
                 { label: 'Audio Channel', key: 'channel', options: ['Stereo', 'Mono', 'Surround 5.1'] },
                 { label: 'Audio Device', key: 'device', options: ['Default', 'Headphones', 'Speaker'] },
               ].map((field) => (
                 <div key={field.key} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{field.label}</label>
                    <CustomDropdown 
                        options={field.options.map(o => ({ id: o, label: o }))}
                        value={(settings.audio as any)[field.key]}
                        onChange={(val) => updateSection('audio', field.key, val)}
                    />
                 </div>
               ))}

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Audio Delay</label>
                    <span className="text-[10px] font-black text-rose-500">{settings.audio.delay.toFixed(1)}s</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => updateSection('audio', 'delay', Math.max(-5, settings.audio.delay - 0.1))}
                      className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all text-xl font-light"
                    >–</button>
                    <div className="flex-1 h-1.5 glass rounded-full relative overflow-hidden">
                       <div className="absolute inset-y-0 left-1/2 h-full bg-rose-600 transition-all" style={{ width: `${(settings.audio.delay / 5) * 50}%` }} />
                    </div>
                    <button 
                      onClick={() => updateSection('audio', 'delay', Math.min(5, settings.audio.delay + 0.1))}
                      className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all text-xl font-light"
                    >+</button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'subtitle' && (
            <div className="space-y-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Subtitle Select</label>
                 <CustomDropdown 
                    options={[
                        {id: 'disable', label: 'Disable'},
                        {id: 'en', label: 'English (Auto)'}
                    ]}
                    value="en"
                    onChange={() => {}}
                 />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button className="py-4 bg-white/5 hover:bg-rose-600/20 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Load Subtitle</button>
                 <button className="py-4 bg-white/5 hover:bg-rose-600/20 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Search Subtitle</button>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Subtitle Delay</label>
                    <span className="text-[10px] font-black text-rose-500">{settings.subtitle.delay.toFixed(1)}s</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => updateSection('subtitle', 'delay', settings.subtitle.delay - 0.5)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-xl font-light hover:bg-rose-600">-</button>
                    <div className="flex-1 h-1 bg-white/10 rounded-full" />
                    <button onClick={() => updateSection('subtitle', 'delay', settings.subtitle.delay + 0.5)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-xl font-light hover:bg-rose-600">+</button>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Subtitle Encoding</label>
                 <div className="flex">
                   <button 
                     onClick={() => updateSection('subtitle', 'encoding', 'Auto')}
                     className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${
                       settings.subtitle.encoding === 'Auto' ? 'bg-rose-600 shadow-xl' : 'bg-white/5 text-white/40'
                     }`}
                   >Auto</button>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/60 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-2xl"
          >
            Apply & Flow
          </button>
        </div>
      </div>
    </div>
  );
});

export default SettingsModal;