import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Track, PlayerState, AppSettings } from './types';
import { MOCK_PLAYLIST } from './constants';
import { 
  PlayIcon, 
  PauseIcon, 
  SkipForwardIcon, 
  SkipBackIcon, 
  ListIcon, 
  HomeIcon,
  FullscreenIcon,
  LoopIcon,
  FitIcon,
  SpeedIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  SubtitleIcon,
  SettingsIcon,
  CameraIcon,
  GifIcon,
  ABRepeatIcon,
  LuminaLogo
} from './components/Icons';
import PlaylistModal from './components/PlaylistModal';
import SettingsModal from './components/SettingsModal';
import ContextMenu from './components/ContextMenu';
import FeedbackModal from './components/FeedbackModal';
import SystemInfoModal from './components/SystemInfoModal';

type FitMode = 'contain' | 'cover' | 'original';

export interface InternalAudioTrack {
  id: string;
  label: string;
  language: string;
  kind: string;
  isExternal: boolean;
  url?: string;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop';

const DEFAULT_SETTINGS: AppSettings = {
  autoNext: true,
  subtitle: {
    fontSize: 20,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 60,
    delay: 0,
    encoding: 'Auto'
  },
  video: {
    aspectRatio: 'Default',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    gamma: 100,
    hardwareAcceleration: true
  },
  audio: {
    delay: 0,
    channel: 'stereo',
    device: 'Default',
    track: 'Internal'
  }
};

const Tooltip: React.FC<{ text: string, position?: 'top' | 'bottom' | 'left' | 'right' }> = ({ text, position = 'top' }) => (
  <div className={`absolute px-2 py-1 glass rounded-lg 
    opacity-0 pointer-events-none transition-all duration-300 z-[70] 
    text-[8px] font-black uppercase tracking-[0.1em] text-white/80 whitespace-nowrap shadow-xl border-white/10
    group-hover/btn:opacity-100
    ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2 translate-y-1 group-hover/btn:translate-y-0' : ''}
    ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2 -translate-y-1 group-hover/btn:translate-y-0' : ''}
    ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2 -translate-x-1 group-hover/btn:translate-x-0' : ''}
    ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2 translate-x-1 group-hover/btn:translate-x-0' : ''}
    `}>
    {text}
  </div>
);

const App: React.FC = () => {
  const [playlist, setPlaylist] = useState<Track[]>(MOCK_PLAYLIST);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [prevVolume, setPrevVolume] = useState(80);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [showVideoOverlay, setShowVideoOverlay] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [isSubtitlesOn, setIsSubtitlesOn] = useState(true);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('');
  const [videoFit, setVideoFit] = useState<FitMode>('contain'); 
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });
  
  const [pointA, setPointA] = useState<number | null>(null);
  const [pointB, setPointB] = useState<number | null>(null);
  const [isABRepeatActive, setIsABRepeatActive] = useState(false);

  const [audioTracks, setAudioTracks] = useState<InternalAudioTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('internal-0');

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lumina_settings_v2');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [feedback, setFeedback] = useState<{
    visible: boolean;
    type: string;
    icon?: string;
    label?: string;
    value?: number;
  }>({ visible: false, type: '' });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const overlayTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const startOverlayTimer = useCallback(() => {
    if (overlayTimeoutRef.current) window.clearTimeout(overlayTimeoutRef.current);
    setShowVideoOverlay(true);
    if (playerState === PlayerState.PLAYING) {
      overlayTimeoutRef.current = window.setTimeout(() => {
        setShowVideoOverlay(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [playerState]);

  const triggerFeedback = useCallback((type: string, options?: { icon?: string, label?: string, value?: number }) => {
    if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
    setFeedback({ 
      visible: true, 
      type, 
      icon: options?.icon, 
      label: options?.label, 
      value: options?.value 
    });
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(prev => ({ ...prev, visible: false }));
    }, 1200);
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `Lumina_Snap_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        triggerFeedback('capture', { icon: '📸', label: 'Ethereal Snap' });
      }
    } catch (e) {
      triggerFeedback('error', { icon: '❌', label: 'CORS Blocked' });
    }
  }, [triggerFeedback]);

  const handleGifToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
      if (!stream) {
        triggerFeedback('error', { icon: '❌', label: 'Incompatible' });
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Lumina_Tease_${Date.now()}.webm`;
        link.click();
        setIsRecording(false);
        triggerFeedback('clip', { icon: '🎬', label: 'Tease Saved' });
      };

      recorder.start();
      setIsRecording(true);
      triggerFeedback('recording', { icon: '🔴', label: 'Recording...' });

    } catch (e) {
      triggerFeedback('error', { icon: '❌', label: 'Restricted' });
    }
  }, [isRecording, triggerFeedback]);

  const handleResetToIdle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current.src = "";
    }
    setCurrentTrack(null);
    setPlayerState(PlayerState.IDLE);
    setProgress(0);
    setCurrentTime(0);
    setActiveSubtitle('');
    setAudioTracks([]);
    setSelectedTrackId('internal-0');
    setPointA(null);
    setPointB(null);
    setIsABRepeatActive(false);
    triggerFeedback('reset', { icon: '🧼', label: 'Ethereal Cleanse' });
  }, [triggerFeedback]);

  const handleClearPlaylist = useCallback(() => {
    setPlaylist([]);
    handleResetToIdle();
    triggerFeedback('clear', { icon: '✨', label: 'Deep Purge' });
  }, [handleResetToIdle, triggerFeedback]);

  const handleTrackSelect = useCallback((track: Track) => {
    setError(null);
    if (videoRef.current) videoRef.current.pause();
    if (externalAudioRef.current) externalAudioRef.current.pause();
    
    setCurrentTrack(track);
    setPlayerState(PlayerState.LOADING);
    setProgress(0);
    setCurrentTime(0);
    setActiveSubtitle('');
    setPlaybackRate(1);
    setShowSpeedMenu(false);
    setShowVideoOverlay(true);
    setAudioTracks([{ id: 'internal-0', label: 'Video Source (Default)', language: 'en', kind: 'main', isExternal: false }]);
    setSelectedTrackId('internal-0');
    setPointA(null);
    setPointB(null);
    setIsABRepeatActive(false);
  }, []);

  const extractMetadata = (file: File): Promise<{ title?: string, artist?: string, coverUrl?: string }> => {
    return new Promise((resolve) => {
      if (!(window as any).jsmediatags) {
        console.warn("jsmediatags not loaded yet");
        resolve({});
        return;
      }
      (window as any).jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          const { title, artist, picture } = tag.tags;
          let coverUrl = undefined;
          if (picture) {
            const { data, format } = picture;
            const blob = new Blob([new Uint8Array(data)], { type: format });
            coverUrl = URL.createObjectURL(blob);
          }
          resolve({ title, artist, coverUrl });
        },
        onError: (error: any) => {
          console.debug("Metadata extraction error:", error);
          resolve({});
        }
      });
    });
  };

  const processFiles = useCallback(async (files: File[]) => {
    const subtitleFiles = files.filter(f => f.name.endsWith('.vtt') || f.name.endsWith('.srt'));
    const mediaFiles = files.filter(f => f.type.startsWith('video/') || f.type.startsWith('audio/'));

    const newTracks: Track[] = await Promise.all(mediaFiles.map(async (file) => {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const matchingSub = subtitleFiles.find(sf => sf.name.replace(/\.[^/.]+$/, "") === baseName);
      
      const metadata = await extractMetadata(file);

      let subtitleUrl = undefined;
      if (matchingSub) {
        if (matchingSub.name.endsWith('.srt')) {
          const text = await matchingSub.text();
          const vttContent = `WEBVTT\n\n${text.replace(/,/g, '.')}`;
          subtitleUrl = URL.createObjectURL(new Blob([vttContent], { type: 'text/vtt' }));
        } else {
          subtitleUrl = URL.createObjectURL(matchingSub);
        }
      }

      return {
        id: `local-${Math.random().toString(36).substr(2, 9)}`,
        title: metadata.title || baseName,
        artist: metadata.artist || "Local Content",
        album: "Gallery",
        coverUrl: metadata.coverUrl || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
        audioUrl: URL.createObjectURL(file),
        subtitleUrl,
        duration: 0,
        type: file.type.startsWith('video/') ? 'video' : 'audio',
      };
    }));
    
    if (newTracks.length > 0) {
      setPlaylist((prev) => [...prev, ...newTracks]);
      triggerFeedback('import', { icon: '📂', label: `${newTracks.length} Injected` });
      if (!currentTrack) handleTrackSelect(newTracks[0]);
    }
  }, [currentTrack, handleTrackSelect, triggerFeedback]);

  const handleAddLocalFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    processFiles(fileArray);
  }, [processFiles]);

  const handleAddUrl = useCallback((url: string) => {
    if (!url.startsWith('http')) return;
    const newTrack: Track = {
      id: `url-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Remote Essence',
      artist: 'Network Stream',
      album: 'Cloud',
      coverUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop",
      audioUrl: url,
      duration: 0,
      type: 'video',
    };
    setPlaylist((prev) => [...prev, newTrack]);
    triggerFeedback('url', { icon: '🌐', label: 'Bound' });
    handleTrackSelect(newTrack);
  }, [handleTrackSelect, triggerFeedback]);

  const togglePlay = useCallback(() => {
    const media = videoRef.current;
    const extAudio = externalAudioRef.current;
    if (!currentTrack && playlist.length > 0) {
      handleTrackSelect(playlist[0]);
      return;
    }
    if (!media || error) return;

    if (playerState === PlayerState.PLAYING) {
      media.pause();
      if (extAudio) extAudio.pause();
      setPlayerState(PlayerState.PAUSED);
      triggerFeedback('pause', { icon: '⏸️', label: 'Paused' });
      setShowVideoOverlay(true);
    } else {
      media.play().catch(e => {
        console.error("Playback failed:", e);
        setError("Playback restricted.");
      });
      if (extAudio && !extAudio.paused) extAudio.play().catch(() => {});
      else if (extAudio) {
        extAudio.currentTime = media.currentTime;
        extAudio.play().catch(() => {});
      }
      setPlayerState(PlayerState.PLAYING);
      triggerFeedback('play', { icon: '▶️', label: 'Flowing' });
      startOverlayTimer();
    }
  }, [playerState, error, currentTrack, playlist, handleTrackSelect, triggerFeedback, startOverlayTimer]);

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    const currentIndex = currentTrack ? playlist.findIndex(t => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % playlist.length;
    handleTrackSelect(playlist[nextIndex]);
    triggerFeedback('next', { icon: '⏭️', label: 'Next' });
  }, [currentTrack, playlist, handleTrackSelect, triggerFeedback]);

  const handlePrev = useCallback(() => {
    if (playlist.length === 0) return;
    const currentIndex = currentTrack ? playlist.findIndex(t => t.id === currentTrack.id) : 0;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    handleTrackSelect(playlist[prevIndex]);
    triggerFeedback('prev', { icon: '⏮️', label: 'Back' });
  }, [currentTrack, playlist, handleTrackSelect, triggerFeedback]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const media = videoRef.current;
    if (media && isFinite(media.duration) && media.duration > 0) {
      const targetTime = (val / 100) * media.duration;
      media.currentTime = targetTime;
      if (externalAudioRef.current) externalAudioRef.current.currentTime = targetTime;
      setProgress(val);
    }
  };

  const updateVolume = (newVol: number) => {
    const clampedVol = Math.max(0, Math.min(100, newVol));
    setVolume(clampedVol);
    const normalizedVol = clampedVol / 100;
    if (videoRef.current) {
        const selectedTrack = audioTracks.find(t => t.id === selectedTrackId);
        if (selectedTrack && !selectedTrack.isExternal) {
            videoRef.current.volume = normalizedVol;
        } else {
            videoRef.current.volume = 0;
        }
    }
    if (externalAudioRef.current) externalAudioRef.current.volume = normalizedVol;
    return clampedVol;
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      updateVolume(0);
      triggerFeedback('mute', { icon: '🔇', label: 'Silent' });
    } else {
      updateVolume(prevVolume > 0 ? prevVolume : 50);
      triggerFeedback('unmute', { icon: '🔊', label: 'Resounding' });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = updateVolume(parseInt(e.target.value));
    triggerFeedback('volume', { value: v });
  };

  const toggleFullscreen = useCallback(() => {
    if (appContainerRef.current) {
      if (!document.fullscreenElement) {
        appContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Fullscreen error: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  };

  const toggleABRepeat = useCallback(() => {
    if (pointA === null || pointB === null) {
      triggerFeedback('error', { icon: '⚠️', label: 'Set Point A & B first' });
      return;
    }
    const newState = !isABRepeatActive;
    setIsABRepeatActive(newState);
    triggerFeedback('ab', { icon: '🔁', label: newState ? 'A/B Repeat On' : 'A/B Repeat Off' });
  }, [pointA, pointB, isABRepeatActive, triggerFeedback]);

  const handleVideoInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (e.detail === 2) {
      if (x < width * 0.3) {
        if (videoRef.current) {
          const targetTime = Math.max(0, videoRef.current.currentTime - 10);
          videoRef.current.currentTime = targetTime;
          if (externalAudioRef.current) externalAudioRef.current.currentTime = targetTime;
          triggerFeedback('seek', { icon: '⏪', label: '-10s' });
        }
      } else if (x > width * 0.7) {
        if (videoRef.current) {
          const targetTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
          videoRef.current.currentTime = targetTime;
          if (externalAudioRef.current) externalAudioRef.current.currentTime = targetTime;
          triggerFeedback('seek', { icon: '⏩', label: '+10s' });
        }
      } else {
        toggleFullscreen();
      }
    } else if (e.detail === 1) {
      togglePlay();
    }
  };

  const scanFileEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => entry.file(resolve));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise<any[]>((resolve) => {
        reader.readEntries(resolve);
      });
      const files = await Promise.all(entries.map(e => scanFileEntry(e)));
      return files.flat();
    }
    return [];
  };

  const handleLoadExternalAudio = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const newTrack: InternalAudioTrack = {
        id: `external-${Date.now()}`,
        label: `External: ${file.name}`,
        language: 'custom',
        kind: 'external',
        isExternal: true,
        url: url
    };
    setAudioTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
    triggerFeedback('audio', { icon: '🎵', label: 'Audio Injected' });
  }, [triggerFeedback]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer?.items?.length) setIsDragging(true); };
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      
      if (e.dataTransfer?.items) {
        const items = Array.from(e.dataTransfer.items);
        const filePromises = items.map((item: any) => {
          const entry = item.webkitGetAsEntry();
          return entry ? scanFileEntry(entry) : null;
        }).filter(p => p !== null);
        
        const fileArrays = await Promise.all(filePromises);
        const allFiles = fileArrays.flat();
        if (allFiles.length > 0) processFiles(allFiles);
      } else if (e.dataTransfer?.files?.length) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    };
    
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [processFiles]);

  useEffect(() => { 
    if (videoRef.current) videoRef.current.playbackRate = playbackRate; 
    if (externalAudioRef.current) externalAudioRef.current.playbackRate = playbackRate;
  }, [playbackRate, currentTrack]);

  useEffect(() => {
    localStorage.setItem('lumina_settings_v2', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const media = videoRef.current;
      if (!media) return;
      if (e.code === 'Escape') { 
        e.preventDefault(); 
        if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
        else handleResetToIdle(); 
        return; 
      }
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); 
            const seekBack = e.ctrlKey ? 30 : 5; 
            media.currentTime = Math.max(0, media.currentTime - seekBack); 
            if (externalAudioRef.current) externalAudioRef.current.currentTime = media.currentTime;
            triggerFeedback('seek', { icon: '⏪', label: `-${seekBack}s` }); 
            break;
        case 'ArrowRight': e.preventDefault(); 
            const seekForward = e.ctrlKey ? 30 : 5; 
            media.currentTime = Math.min(media.duration, media.currentTime + seekForward); 
            if (externalAudioRef.current) externalAudioRef.current.currentTime = media.currentTime;
            triggerFeedback('seek', { icon: '⏩', label: `+${seekForward}s` }); 
            break;
        case 'ArrowUp': e.preventDefault(); const volUp = updateVolume(volume + 5); triggerFeedback('volume', { value: volUp }); break;
        case 'ArrowDown': e.preventDefault(); const volDown = updateVolume(volume - 5); triggerFeedback('volume', { value: volDown }); break;
        case 'KeyG': e.preventDefault(); toggleFullscreen(); break; 
        case 'KeyM': e.preventDefault(); toggleMute(); break;
        case 'KeyF': 
            e.preventDefault();
            media.currentTime = Math.min(media.duration, media.currentTime + (1/30));
            if (externalAudioRef.current) externalAudioRef.current.currentTime = media.currentTime;
            triggerFeedback('seek', { icon: '⏩', label: '+1 Frame' });
            break;
        case 'KeyD': 
            e.preventDefault();
            media.currentTime = Math.max(0, media.currentTime - (1/30));
            if (externalAudioRef.current) externalAudioRef.current.currentTime = media.currentTime;
            triggerFeedback('seek', { icon: '⏪', label: '-1 Frame' });
            break;
        case 'BracketLeft': 
            e.preventDefault();
            if (e.shiftKey) {
                setPointA(null);
                setIsABRepeatActive(false);
                triggerFeedback('ab', { icon: '🗑️', label: 'Clear Point A' });
            } else {
                const now = media.currentTime;
                setPointA(now);
                if (pointB !== null) {
                  setIsABRepeatActive(true);
                  triggerFeedback('ab', { icon: '🔁🅰️', label: 'Auto Loop Active' });
                } else {
                  triggerFeedback('ab', { icon: '🅰️', label: 'Point A Set' });
                }
            }
            break;
        case 'BracketRight': 
            e.preventDefault();
            if (e.shiftKey) {
                setPointB(null);
                setIsABRepeatActive(false);
                triggerFeedback('ab', { icon: '🗑️', label: 'Clear Point B' });
            } else {
                const now = media.currentTime;
                setPointB(now);
                if (pointA !== null) {
                  setIsABRepeatActive(true);
                  triggerFeedback('ab', { icon: '🔁🅱️', label: 'Auto Loop Active' });
                } else {
                  triggerFeedback('ab', { icon: '🅱️', label: 'Point B Set' });
                }
            }
            break;
        case 'Backslash':
            e.preventDefault();
            toggleABRepeat();
            break;
      }
      startOverlayTimer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, volume, prevVolume, handleResetToIdle, triggerFeedback, startOverlayTimer, handleNext, handlePrev, contextMenu, toggleABRepeat, pointA, pointB]);

  useEffect(() => {
    const media = videoRef.current;
    if (media && currentTrack?.audioUrl) {
      setPlayerState(PlayerState.LOADING);
      media.src = currentTrack.audioUrl;
      media.load();
      media.volume = volume / 100;
      const onCanPlay = () => { 
        setPlayerState(PlayerState.PLAYING); 
        media.play().catch(() => setPlayerState(PlayerState.PAUSED));
        
        const detected: InternalAudioTrack[] = [{ id: 'internal-0', label: 'Original Source', language: 'en', kind: 'main', isExternal: false }];
        if ((media as any).audioTracks) {
            const tracks = (media as any).audioTracks;
            for (let i = 0; i < tracks.length; i++) {
                detected.push({
                    id: `internal-${i + 1}`,
                    label: tracks[i].label || `Track ${i + 1}`,
                    language: tracks[i].language,
                    kind: tracks[i].kind,
                    isExternal: false
                });
            }
        }
        setAudioTracks(detected);
        startOverlayTimer();
      };
      media.addEventListener('canplay', onCanPlay, { once: true });
      return () => media.removeEventListener('canplay', onCanPlay);
    }
  }, [currentTrack]);

  useEffect(() => {
    const media = videoRef.current;
    const extAudio = externalAudioRef.current;
    if (!media) return;

    const selectedTrack = audioTracks.find(t => t.id === selectedTrackId);
    if (!selectedTrack) return;

    if (selectedTrack.isExternal && selectedTrack.url) {
        media.muted = true;
        if (extAudio) {
            extAudio.src = selectedTrack.url;
            extAudio.currentTime = media.currentTime;
            extAudio.volume = volume / 100;
            extAudio.playbackRate = playbackRate;
            if (playerState === PlayerState.PLAYING) extAudio.play().catch(() => {});
        }
    } else {
        media.muted = false;
        media.volume = volume / 100;
        if (extAudio) {
            extAudio.pause();
            extAudio.src = "";
        }
        if ((media as any).audioTracks) {
            const trackIndex = parseInt(selectedTrackId.split('-')[1]);
            const tracks = (media as any).audioTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].enabled = (i === trackIndex);
            }
        }
    }
  }, [selectedTrackId, audioTracks]);

  useEffect(() => {
    const video = videoRef.current;
    const onTimeUpdate = (e: Event) => {
      const el = e.target as HTMLMediaElement;
      if (isFinite(el.duration) && el.duration > 0) {
        setProgress((el.currentTime / el.duration) * 100);
        setCurrentTime(el.currentTime);

        if (isABRepeatActive && pointA !== null && pointB !== null) {
          const start = Math.min(pointA, pointB);
          const end = Math.max(pointA, pointB);
          if (el.currentTime >= end) {
            el.currentTime = start;
            if (externalAudioRef.current) externalAudioRef.current.currentTime = start;
          }
        }
      }
    };
    const onEnded = () => {
      if (isLooping) {
        videoRef.current!.currentTime = 0;
        if (externalAudioRef.current) externalAudioRef.current.currentTime = 0;
        videoRef.current!.play();
      } else if (settings.autoNext) {
        handleNext();
      }
    };
    video?.addEventListener('timeupdate', onTimeUpdate);
    video?.addEventListener('ended', onEnded);
    return () => {
      video?.removeEventListener('timeupdate', onTimeUpdate);
      video?.removeEventListener('ended', onEnded);
    };
  }, [handleNext, isLooping, settings.autoNext, isABRepeatActive, pointA, pointB]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCueChange = (e: Event) => {
      const track = e.target as TextTrack;
      if (track.activeCues && track.activeCues.length > 0) {
        const cue = track.activeCues[0] as VTTCue;
        setActiveSubtitle(cue.text);
      } else {
        setActiveSubtitle('');
      }
    };

    const setupTrack = () => {
      if (video.textTracks && video.textTracks.length > 0) {
        const track = video.textTracks[0];
        track.mode = 'hidden'; 
        track.addEventListener('cuechange', onCueChange);
        return () => track.removeEventListener('cuechange', onCueChange);
      }
    };

    const timeout = setTimeout(setupTrack, 500);
    return () => {
      clearTimeout(timeout);
      if (video.textTracks && video.textTracks.length > 0) {
        video.textTracks[0].removeEventListener('cuechange', onCueChange);
      }
    };
  }, [currentTrack]);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleFitMode = () => {
    const modes: FitMode[] = ['contain', 'cover', 'original'];
    const nextIndex = (modes.indexOf(videoFit) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setVideoFit(nextMode);
    const labels = { contain: 'Letterbox', cover: 'Immersive', original: 'Pure' };
    const icons = { contain: '🖼️', cover: '🧴', original: '📏' };
    triggerFeedback('fit', { icon: icons[nextMode], label: labels[nextMode] });
  };

  const toggleSubtitles = useCallback(() => {
    const newState = !isSubtitlesOn;
    setIsSubtitlesOn(newState);
    triggerFeedback('sub', { icon: '💬', label: newState ? 'Sub: On' : 'Sub: Off' });
  }, [isSubtitlesOn, triggerFeedback]);

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  const videoStyle = (): React.CSSProperties => {
    const v = settings.video;
    const filters = `brightness(${v.brightness}%) contrast(${v.contrast}%) saturate(${v.saturation}%) hue-rotate(${v.hue}deg) brightness(${v.gamma}%)`;
    
    let base: React.CSSProperties = { 
        filter: filters,
        transition: 'filter 0.3s ease'
    };

    if (v.aspectRatio !== 'Default') {
        const [w, h] = v.aspectRatio.split(':').map(Number);
        base.aspectRatio = `${w}/${h}`;
    }

    switch (videoFit) {
        case 'cover': return { ...base, objectFit: 'cover', width: '100%', height: '100%' };
        case 'original': return { ...base, objectFit: 'none', width: 'auto', height: 'auto', minWidth: '100%', minHeight: '100%' };
        default: return { ...base, objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' };
    }
  };

  const contextMenuActions = useMemo(() => ({
    openFiles: () => fileInputRef.current?.click(),
    openFolder: () => folderInputRef.current?.click(),
    openOnline: () => setIsPlaylistOpen(true),
    restart: () => { 
        if(videoRef.current) videoRef.current.currentTime = 0; 
        if(externalAudioRef.current) externalAudioRef.current.currentTime = 0;
    },
    stop: handleResetToIdle,
    setSpeed: (s: number) => setPlaybackRate(s),
    currentSpeed: playbackRate,
    toggleSub: toggleSubtitles,
    isSubOn: isSubtitlesOn,
    openSettings: () => setIsSettingsOpen(true),
    openFeedback: () => setIsFeedbackOpen(true),
    openSystemInfo: () => setIsSystemInfoOpen(true)
  }), [handleResetToIdle, playbackRate, toggleSubtitles, isSubtitlesOn]);

  return (
    <div 
      ref={appContainerRef} 
      className="relative w-full h-screen overflow-hidden flex flex-col bg-black text-white selection:bg-rose-500/30 font-sans"
      onContextMenu={handleContextMenu}
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 bg-[#020617]" />
         <div className="absolute top-[-20%] left-[-15%] w-[110%] h-[110%] rounded-full bg-purple-900/10 mix-blend-screen filter blur-[120px]" />
         <div className="absolute bottom-[-30%] right-[-15%] w-[100%] h-[100%] rounded-full bg-rose-900/10 mix-blend-screen filter blur-[120px]" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 opacity-70" />
      </div>

      {/* Floating Logo Branding */}
      <div className={`fixed top-6 left-6 z-[100] transition-all duration-1000 ${playerState === PlayerState.IDLE ? 'opacity-0 -translate-x-10' : 'opacity-100 translate-x-0'}`}>
        <div className="flex items-center gap-3 glass p-2 pr-5 rounded-2xl border-white/10 shadow-2xl group cursor-pointer hover:bg-white/5 transition-all">
          <LuminaLogo className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-tighter text-white/90 leading-none">LUMINA</span>
            <span className="text-[6px] font-black uppercase tracking-[0.2em] text-rose-500 leading-none mt-1">Player</span>
          </div>
        </div>
      </div>

      <main className="relative z-10 w-full h-full flex flex-col items-center" onMouseMove={startOverlayTimer} onTouchStart={startOverlayTimer}>
        
        {isDragging && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-rose-600/20 backdrop-blur-xl animate-in fade-in zoom-in duration-300 pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.3)]">
              <span className="text-6xl animate-bounce">📥</span>
            </div>
            <p className="mt-8 text-[12px] font-black uppercase tracking-[0.5em] text-white">
              Lepasin di dalam gue, dong...
            </p>
            <p className="mt-2 text-[8px] font-black uppercase tracking-[0.3em] text-white/40">
              Video or Folder injection active
            </p>
          </div>
        )}

        <div className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto min-w-[320px] sm:max-w-xl flex items-center justify-center gap-4 px-5 py-2.5 glass-dark rounded-full border-white/10 shadow-2xl z-[80] transition-all duration-700 
          ${(!showVideoOverlay && playerState === PlayerState.PLAYING) || playerState === PlayerState.IDLE ? 'opacity-0 -translate-y-10 scale-90 pointer-events-none' : 'opacity-100 translate-y-0 scale-100 pointer-events-auto'}`}>
          <div className="flex items-center gap-2">
            <div className="relative group/btn">
              <button onClick={(e) => { e.stopPropagation(); handleResetToIdle(); }} className="p-1.5 text-white/40 hover:text-white transition-all">
                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Tooltip text="Home" position="bottom" />
            </div>
            <div className="relative group/btn">
              <button onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }} className={`p-1.5 transition-all ${isSettingsOpen ? 'text-rose-500' : 'text-white/40 hover:text-white'}`}>
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Tooltip text="Settings" position="bottom" />
            </div>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-end gap-[2px] h-3.5 sm:h-4 px-2 py-0.5 bg-rose-500/10 rounded-lg shrink-0 border border-rose-500/10 min-w-[28px] justify-center overflow-hidden">
               {[0.7, 0.4, 0.9, 0.55].map((delay, i) => (
                  <div 
                    key={i} 
                    className={`w-[2px] bg-rose-500 rounded-full transition-all duration-500 ${playerState === PlayerState.PLAYING ? 'animate-bar-pulse' : 'h-[20%]'}`}
                    style={{ 
                      animationDelay: `-${delay}s`,
                      boxShadow: '0 0 8px rgba(244, 63, 94, 0.4)'
                    }} 
                  />
               ))}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] text-white/20 leading-none mb-1">Playing</span>
              <span className="text-[9px] sm:text-[11px] font-black tracking-tight text-white/90 leading-none truncate pr-2">
                {currentTrack ? `${currentTrack.title} — ${currentTrack.artist}` : 'Waiting for media...'}
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
          {playerState === PlayerState.IDLE && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000 z-50 px-6">
               <div className="relative mb-6">
                  <img 
                    src="https://png.pngtree.com/png-clipart/20250215/original/pngtree-sexy-glossy-red-lips-with-colorful-paint-splash-illustration-png-image_19839828.png" 
                    className="absolute -top-2 -left-6 sm:-top-6 sm:-left-12 w-20 h-14 sm:w-40 sm:h-28 z-[60] -rotate-12 drop-shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse pointer-events-none select-none"
                    alt="Sexy Lips"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] bg-rose-600 blur-[140px] opacity-20 pointer-events-none" />
                  <h1 className="relative text-6xl sm:text-[10rem] font-black italic leading-none tracking-tighter">
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/10">LUMINA</span>
                  </h1>
               </div>
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.8em] text-rose-500/50 mb-12 ml-[0.8em]">Pure Visual Performance</p>
               <button onClick={() => setIsPlaylistOpen(true)} className="group/main-btn relative px-12 sm:px-16 py-4 sm:py-5 rounded-full overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-2xl">
                  <div className="absolute inset-0 bg-white group-hover/main-btn:bg-rose-500 transition-all duration-500" />
                  <span className="relative text-[10px] font-black uppercase tracking-[0.3em] text-black group-hover/main-btn:text-white transition-all duration-500 ml-[0.3em]">Open Library</span>
               </button>
            </div>
          )}

          {currentTrack?.type === 'audio' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-1000">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img 
                  src={currentTrack.coverUrl || DEFAULT_COVER} 
                  className="w-full h-full object-cover blur-[120px] opacity-40 scale-125 transition-all duration-1000" 
                  alt="" 
                />
              </div>
              
              <div className="relative z-20 group/cover flex flex-col items-center">
                <div className="relative">
                  <div className={`absolute inset-0 bg-rose-600 blur-[60px] opacity-20 transition-opacity duration-1000 rounded-full ${playerState === PlayerState.PLAYING ? 'animate-pulse' : 'opacity-0'}`} />
                  
                  <div className="relative z-30 w-56 h-56 sm:w-80 sm:h-80 rounded-[3.5rem] overflow-hidden border border-white/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 group-hover/cover:scale-[1.03] group-hover/cover:rotate-1">
                    <img 
                      src={currentTrack.coverUrl || DEFAULT_COVER} 
                      className={`w-full h-full object-cover transition-all duration-700 ${playerState === PlayerState.PLAYING ? 'scale-105' : 'scale-100 grayscale-[0.3]'}`} 
                      alt={currentTrack.title} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <video 
            ref={videoRef} 
            className={`relative z-10 transition-all duration-1000 w-full h-full pointer-events-none ${playerState === PlayerState.IDLE ? 'opacity-0 scale-110' : 'opacity-100 scale-100'} ${currentTrack?.type === 'audio' ? 'opacity-0 invisible' : ''}`} 
            style={videoStyle()} 
            crossOrigin="anonymous"
          >
            {currentTrack?.subtitleUrl && isSubtitlesOn && (
              <track 
                key={currentTrack.id}
                src={currentTrack.subtitleUrl} 
                kind="subtitles" 
                srcLang="en" 
                label="English" 
                default 
              />
            )}
          </video>
          
          <audio ref={externalAudioRef} className="hidden" />

          {activeSubtitle && isSubtitlesOn && (
            <div className={`absolute left-1/2 -translate-x-1/2 z-[40] w-full max-w-[90%] flex justify-center transition-all duration-500 px-4 text-center pointer-events-none ${showVideoOverlay ? 'bottom-32 sm:bottom-40' : 'bottom-8 sm:bottom-12'}`}>
              <span 
                className="inline-block px-4 py-2.5 rounded-2xl border border-white/5 shadow-2xl leading-snug transition-all"
                style={{ 
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  fontSize: `${settings.subtitle.fontSize}px`,
                  fontFamily: settings.subtitle.fontFamily,
                  color: settings.subtitle.textColor,
                  backgroundColor: hexToRgba(settings.subtitle.backgroundColor, settings.subtitle.backgroundOpacity),
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transform: `translateY(${settings.subtitle.delay * -5}px)`
                }}
                dangerouslySetInnerHTML={{ __html: activeSubtitle.replace(/\n/g, '<br/>') }}
              />
            </div>
          )}

          <div className={`absolute inset-0 z-20 flex flex-col transition-all duration-500 ${showVideoOverlay && playerState !== PlayerState.IDLE ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <div className="flex-1 cursor-pointer" onClick={handleVideoInteraction} />
             
             <div className="absolute top-1/2 -translate-y-1/2 left-6 sm:left-8 flex flex-col gap-3">
                <div className="relative group/btn">
                  <button onClick={(e) => { e.stopPropagation(); handleCapture(); }} className="p-3 sm:p-3.5 glass-dark rounded-xl sm:rounded-2xl text-white/30 hover:text-white transition-all border border-white/5 shadow-2xl">
                    <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <Tooltip text="Capture" position="right" />
                </div>
                <div className="relative group/btn">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleGifToggle(); }} 
                    className={`p-3 sm:p-3.5 glass-dark rounded-xl sm:rounded-2xl transition-all border shadow-2xl ${
                      isRecording 
                        ? 'text-rose-500 border-rose-500/50 animate-pulse bg-rose-500/10' 
                        : 'text-white/30 hover:text-white border-white/5'
                    }`}
                  >
                    <GifIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <Tooltip text={isRecording ? "Stop Recording" : "Record GIF"} position="right" />
                </div>
             </div>

             <div className={`fixed z-[80] transition-all duration-700 
                right-4 sm:right-8 
                top-1/2 -translate-y-1/2 sm:top-6 sm:translate-y-0 
                flex flex-col sm:flex-row items-center gap-2.5`}>
                {[
                  { id: 'ab', icon: <ABRepeatIcon className="w-4 h-4 sm:w-5 sm:h-5" />, active: isABRepeatActive || pointA !== null || pointB !== null, label: 'A/B Loop', action: (e: any) => { e.stopPropagation(); toggleABRepeat(); } },
                  { id: 'speed', icon: <SpeedIcon className="w-4 h-4 sm:w-5 sm:h-5" />, active: playbackRate !== 1, label: 'Speed', action: (e: any) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); } },
                  { id: 'sub', icon: <SubtitleIcon className="w-4 h-4 sm:w-5 sm:h-5" />, active: isSubtitlesOn, label: 'Captions', action: (e: any) => { e.stopPropagation(); toggleSubtitles(); } },
                  { id: 'fit', icon: <FitIcon className="w-4 h-4 sm:w-5 sm:h-5" />, active: videoFit !== 'contain', label: 'Fit Mode', action: (e: any) => { e.stopPropagation(); cycleFitMode(); } },
                  { id: 'full', icon: <FullscreenIcon className="w-4 h-4 sm:w-5 sm:h-5" />, active: false, label: 'Fullscreen', action: (e: any) => { e.stopPropagation(); toggleFullscreen(); } }
                ].map((btn) => (
                  <div key={btn.id} className="relative group/btn">
                    <button onClick={btn.action} className={`p-3 sm:p-3.5 glass-dark rounded-xl sm:rounded-2xl transition-all border border-white/5 shadow-2xl ${btn.active ? 'text-rose-400 border-rose-500/30' : 'text-white/30 hover:text-white'}`}>
                      {btn.icon}
                    </button>
                    <Tooltip text={btn.label} position={window.innerWidth < 640 ? "left" : "bottom"} />
                    {btn.id === 'speed' && showSpeedMenu && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 sm:top-full sm:right-0 sm:mt-3 sm:translate-y-0 p-1.5 glass-dark rounded-2xl border border-white/10 flex flex-col gap-1 z-[100] animate-in slide-in-from-right-2 sm:slide-in-from-top-2 duration-300 min-w-[100px]">
                        {[0.5, 1, 1.5, 2].map(rate => (
                          <button key={rate} onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); triggerFeedback('speed', { icon: '⚡', label: `${rate}x Speed` }); }} className={`px-4 py-2 text-[9px] font-black rounded-xl text-left transition-all ${playbackRate === rate ? 'bg-rose-600 text-white' : 'hover:bg-white/10 text-white/40'}`}>
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className={`fixed inset-0 flex items-center justify-center z-[150] pointer-events-none transition-all duration-500 ${feedback.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
             <div className="relative glass-dark border-rose-500/20 border px-10 py-5 sm:px-12 sm:py-6 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-4xl animate-bounce">{feedback.icon || '✨'}</span>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/80">{feedback.label || (feedback.type === 'volume' ? `${feedback.value}%` : '')}</span>
             </div>
        </div>

        <div className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full px-4 sm:px-8 transition-all duration-700 z-[90] max-w-4xl
          ${showVideoOverlay && playerState !== PlayerState.IDLE ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-20 opacity-0 scale-95 pointer-none'}`}>
          <div className="glass-dark rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
               <div className="flex items-center gap-2">
                 <button onClick={handlePrev} className="p-1.5 text-white/20 hover:text-white transition-all"><SkipBackIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                 <button onClick={togglePlay} className="bg-white text-black w-10 h-10 sm:w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl">
                   {playerState === PlayerState.PLAYING ? <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
                 </button>
                 <button onClick={handleNext} className="p-1.5 text-white/20 hover:text-white transition-all"><SkipForwardIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
               </div>

               <div className="flex-1 w-full flex flex-col gap-1.5 sm:gap-2">
                 <div className="flex justify-between items-center px-0.5">
                    <span className="text-[7px] sm:text-[8px] font-black text-white/30 tracking-widest">{formatTime(currentTime)}</span>
                    <span className="text-[7px] sm:text-[8px] font-black text-white/30 tracking-widest">{formatTime(videoRef.current?.duration || 0)}</span>
                 </div>
                 <div className="relative h-1 sm:h-1.5 bg-white/5 rounded-full flex items-center group/progress cursor-pointer">
                    <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleProgressChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
                    <div className="absolute inset-0 h-full bg-white/10 rounded-full" />
                    
                    {pointA !== null && pointB !== null && videoRef.current && (
                      <div 
                        className={`absolute h-full ${isABRepeatActive ? 'bg-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-white/10'} rounded-full z-[5] transition-all`}
                        style={{ 
                          left: `${(Math.min(pointA, pointB) / videoRef.current.duration) * 100}%`,
                          width: `${(Math.abs(pointB - pointA) / videoRef.current.duration) * 100}%`
                        }}
                      />
                    )}

                    {pointA !== null && videoRef.current && isFinite(videoRef.current.duration) && (
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-rose-600 rounded-full z-10 shadow-[0_0_12px_rgba(225,29,72,1)] border border-white/40" 
                          style={{ left: `${(pointA / videoRef.current.duration) * 100}%` }}
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-black text-rose-400">A</span>
                        </div>
                    )}
                    {pointB !== null && videoRef.current && isFinite(videoRef.current.duration) && (
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-rose-600 rounded-full z-10 shadow-[0_0_12px_rgba(225,29,72,1)] border border-white/40" 
                          style={{ left: `${(pointB / videoRef.current.duration) * 100}%` }}
                        >
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-black text-rose-400">B</span>
                        </div>
                    )}

                    <div className="relative h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-2xl scale-0 group-hover/progress:scale-100 transition-transform" />
                    </div>
                 </div>
               </div>

               <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl">
                    <button onClick={toggleMute} className="text-white/30 hover:text-white">{volume === 0 ? <VolumeMuteIcon className="w-4 h-4" /> : <VolumeHighIcon className="w-4 h-4" />}</button>
                    <div className="w-16 h-1 bg-white/10 rounded-full relative flex items-center group/vol">
                       <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${volume}%` }} />
                    </div>
                  </div>

                  <button onClick={() => { const nl = !isLooping; setIsLooping(nl); triggerFeedback('loop', { icon: '🔁', label: nl ? 'Loop On' : 'Loop Off' }); }} className={`p-2.5 rounded-xl transition-all border ${isLooping ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-white/5 text-white/20 border-transparent hover:text-white'}`}>
                    <LoopIcon className="w-4 h-4" />
                  </button>
                  
                  <button onClick={() => setIsPlaylistOpen(true)} className="bg-rose-600 text-white p-2.5 sm:p-3 rounded-xl transition-all hover:bg-rose-500 hover:scale-105 active:scale-95 shadow-lg">
                    <ListIcon className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>

      <PlaylistModal 
        isOpen={isPlaylistOpen} 
        onClose={() => setIsPlaylistOpen(false)} 
        tracks={playlist} 
        currentTrackId={currentTrack?.id || ''} 
        onTrackSelect={handleTrackSelect} 
        onAddFiles={handleAddLocalFiles} 
        onAddUrl={handleAddUrl}
        onClearPlaylist={handleClearPlaylist}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        audioTracks={audioTracks}
        selectedTrackId={selectedTrackId}
        onTrackChange={setSelectedTrackId}
        onLoadExternalAudio={handleLoadExternalAudio}
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <SystemInfoModal 
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
        videoRef={videoRef}
      />

      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleAddLocalFiles(e.target.files)} accept="video/*,audio/*" multiple className="hidden" />
      <input type="file" ref={folderInputRef} onChange={(e) => e.target.files && handleAddLocalFiles(e.target.files)} multiple className="hidden" {...({ webkitdirectory: "true", directory: "true" } as any)} />
      
      {contextMenu.visible && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          isOpen={contextMenu.visible} 
          onClose={() => setContextMenu({ ...contextMenu, visible: false })} 
          actions={contextMenuActions} 
        />
      )}
    </div>
  );
};

export default App;