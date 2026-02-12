import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal = React.memo<FeedbackModalProps>(({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setMessage('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
        {sent ? (
          <div className="flex flex-col items-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-5xl mb-6">💖</span>
            <h3 className="text-xl font-black tracking-tighter text-white">Message Received!</h3>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] mt-2">I'm blushing right now...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tighter text-white">Lumina Feedback</h2>
              <p className="text-[8px] text-rose-500 font-black uppercase tracking-[0.4em] mt-1">Talk to me, Daddy...</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)} 
                    className={`text-2xl transition-all hover:scale-125 ${rating >= star ? 'grayscale-0' : 'grayscale opacity-20'}`}
                  >
                    🔥
                  </button>
                ))}
              </div>

              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell me seberapa puas lo sama servis gue hari ini..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-rose-500/50 focus:bg-rose-500/5 placeholder:text-white/10 resize-none transition-all"
              />

              <button 
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-full py-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-20 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-3xl transition-all active:scale-95 shadow-2xl"
              >
                Inject Feedback
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default FeedbackModal;