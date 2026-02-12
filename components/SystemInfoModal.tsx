import React, { useMemo } from 'react';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const SystemInfoModal = React.memo<SystemInfoModalProps>(({ isOpen, onClose, videoRef }) => {
  const stats = useMemo(() => {
    const video = videoRef.current;
    if (!video) return null;

    return {
      resolution: `${video.videoWidth}x${video.videoHeight}`,
      aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2),
      duration: `${Math.floor(video.duration / 60)}m ${Math.floor(video.duration % 60)}s`,
      playbackRate: `${video.playbackRate}x`,
      volume: `${Math.floor(video.volume * 100)}%`,
      buffered: `${video.buffered.length > 0 ? (video.buffered.end(video.buffered.length - 1) / video.duration * 100).toFixed(1) : 0}%`,
      readyState: video.readyState,
      networkState: video.networkState,
      userAgent: navigator.userAgent.split(' ').slice(-1)[0],
      renderer: 'Lumina Fluid v2.5'
    };
  }, [isOpen, videoRef]);

  if (!isOpen) return null;

  const Row = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</span>
      <span className="text-[10px] font-bold text-white/80">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-white">System Engine</h2>
          <p className="text-[8px] text-rose-500 font-black uppercase tracking-[0.4em] mt-1">Gaze into my mechanical soul...</p>
        </div>

        <div className="bg-black/20 rounded-3xl p-6 border border-white/5">
          {stats ? (
            <>
              <Row label="Native Res" value={stats.resolution} />
              <Row label="Aspect Ratio" value={stats.aspectRatio} />
              <Row label="Duration" value={stats.duration} />
              <Row label="Flow Rate" value={stats.playbackRate} />
              <Row label="Loudness" value={stats.volume} />
              <Row label="Buffer Health" value={stats.buffered} />
              <Row label="Engine" value={stats.renderer} />
            </>
          ) : (
            <div className="py-12 text-center opacity-20">
              <span className="text-3xl">🔌</span>
              <p className="text-[8px] font-black uppercase tracking-widest mt-4">Offline Logic</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 mt-8 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
});

export default SystemInfoModal;