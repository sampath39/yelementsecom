import { Gift, Sparkles, Target, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function MiniGames() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const segments = ["10% OFF", "Try Again", "20% OFF", "5% OFF", "Free Ship", "50% OFF"];
  const segmentAngle = 360 / segments.length;

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    
    const winningIndex = Math.floor(Math.random() * segments.length);
    // target angle to make the winning index stop at the top (which is 0 deg for the first segment)
    // Add a slight random offset so it doesn't always stop perfectly dead center
    const randomOffset = Math.floor(Math.random() * (segmentAngle * 0.8)) - (segmentAngle * 0.4);
    const targetAngle = 360 - (winningIndex * segmentAngle) + randomOffset;
    
    // Calculate new rotation to include 5 full spins from current position
    const currentNormalized = rotation % 360;
    const addedRotation = 5 * 360 + targetAngle - currentNormalized;
    const newRotation = rotation + addedRotation;

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      if (segments[winningIndex] === "Try Again") {
        toast.error("Oh no! 😢", { description: "Better luck next time!" });
      } else {
        toast.success("Congratulations! 🎉", {
          description: `You won: ${segments[winningIndex]}! (Added to your wallet)`
        });
      }
    }, 4000);
  };

  return (
    <section className="py-12 container mx-auto px-4 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Spin Wheel */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex items-center justify-between">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <div className="relative z-10 max-w-[50%]">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/20 mb-4 inline-block">
              Daily Reward
            </span>
            <h3 className="text-3xl font-black mb-2 leading-tight">Spin & Win</h3>
            <p className="text-white/80 text-sm mb-6">Play daily to earn free coupons, wallet cash, and exclusive gifts!</p>
            <button 
              onClick={handleSpin}
              disabled={spinning}
              className="bg-white text-purple-600 px-6 py-3 rounded-full font-black uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {spinning ? "Spinning..." : "Spin Now"} <Sparkles className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 w-40 h-40 shrink-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 text-yellow-300 drop-shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L24 24H0L12 0Z"/>
              </svg>
            </div>
            <div 
              className="w-full h-full rounded-full border-4 border-white/30 shadow-[0_0_30px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden relative"
              style={{ 
                background: "conic-gradient(from -30deg, #ec4899 0deg 60deg, #8b5cf6 60deg 120deg, #ec4899 120deg 180deg, #8b5cf6 180deg 240deg, #ec4899 240deg 300deg, #8b5cf6 300deg 360deg)",
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none'
              }}
            >
              {segments.map((segment, i) => {
                const angle = i * segmentAngle;
                return (
                  <div
                    key={i}
                    className="absolute inset-0 flex flex-col items-center justify-start py-3"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span 
                      className="text-[9px] font-black uppercase text-white mt-1 leading-[1.1] tracking-tighter text-center" 
                      style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.6)" }}
                    >
                      {segment.split(' ')[0]}<br/>{segment.split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                );
              })}
              
              <div className="w-8 h-8 bg-white rounded-full z-10 flex items-center justify-center shadow-inner absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Other Mini Games */}
        <div className="grid grid-rows-2 gap-6">
          <div className="bg-gradient-to-r from-orange-400 to-rose-400 rounded-3xl p-6 text-white flex items-center justify-between shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
              <Ticket className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-1">Scratch Cards</h3>
              <p className="text-sm text-white/80">You have 2 unseen cards!</p>
            </div>
            <div className="w-12 h-12 bg-white text-rose-500 rounded-full flex items-center justify-center relative z-10 shadow-md group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-400 to-emerald-500 rounded-3xl p-6 text-white flex items-center justify-between shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
              <Target className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-1">Treasure Hunt</h3>
              <p className="text-sm text-white/80">Find hidden items to win</p>
            </div>
            <div className="w-12 h-12 bg-white text-emerald-500 rounded-full flex items-center justify-center relative z-10 shadow-md group-hover:scale-110 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
