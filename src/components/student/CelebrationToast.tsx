import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface CelebrationToastProps {
  message: string;
  medal: string;
  onClose: () => void;
}

export const CelebrationToast = ({ message, medal, onClose }: CelebrationToastProps) => {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleBubbleClick = () => {
    setIsMinimized(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347']
    });
    
    // Auto-minimize again after 30 seconds
    setTimeout(() => {
      setIsMinimized(true);
    }, 30000);
  };

  if (isMinimized) {
    return (
      <button
        onClick={handleBubbleClick}
        className="fixed bottom-20 left-4 z-50 flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-3 rounded-full shadow-lg hover:scale-105 transition-transform animate-bounce"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-2xl">{medal}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-4 md:right-auto md:max-w-md z-50 animate-scale-in">
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 p-1 rounded-lg shadow-2xl">
        <div className="bg-background rounded-lg p-6 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute left-2 top-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-4 pt-6">
            <div className="text-6xl animate-pulse">{medal}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                מזל טוב!
              </h3>
              <p className="text-foreground leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
