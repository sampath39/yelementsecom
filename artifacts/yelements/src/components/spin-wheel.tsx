import { useState } from "react";
import { Gift, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface SpinWheelProps {
  onSpin: () => Promise<{ success: boolean; reward?: any; pointsAwarded?: number; message?: string }>;
  hasSpun: boolean;
}

export default function SpinWheel({ onSpin, hasSpun }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);

  const segments = [
    { label: "10 Pts", color: "#10B981", value: 10 },
    { label: "20 Pts", color: "#3B82F6", value: 20 },
    { label: "50 Pts", color: "#8B5CF6", value: 50 },
    { label: "Coupon", color: "#F59E0B", value: "coupon" },
    { label: "5% Off", color: "#EC4899", value: "discount" },
    { label: "Try Again", color: "#6B7280", value: 0 },
  ];

  const handleSpin = async () => {
    if (spinning || hasSpun) return;

    setSpinning(true);
    setResult(null);

    try {
      const response = await onSpin();
      
      if (response.success) {
        // Calculate rotation based on reward
        const segmentIndex = segments.findIndex(s => s.value === response.reward?.value);
        const segmentAngle = 360 / segments.length;
        const targetAngle = segmentIndex * segmentAngle;
        const spins = 5; // Number of full rotations
        const finalRotation = spins * 360 + (360 - targetAngle);
        
        setRotation(finalRotation);
        setResult(response.reward);
        
        setTimeout(() => {
          toast.success("Spin complete!", { 
            description: response.reward?.type === "points" 
              ? `You won ${response.pointsAwarded} points!` 
              : `You won ${response.reward?.value}` 
          });
        }, 3000);
      } else {
        toast.error("Spin failed", { description: response.message });
      }
    } catch (err) {
      toast.error("Spin failed", { description: "Something went wrong" });
    } finally {
      setTimeout(() => setSpinning(false), 3000);
    }
  };

  const segmentAngle = 360 / segments.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Spin & Win
        </CardTitle>
        <CardDescription>Spin the wheel to win exciting rewards!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          {/* Wheel */}
          <div className="relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-500" />
            </div>
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
              className="drop-shadow-lg"
            >
              {segments.map((segment, index) => {
                const startAngle = index * segmentAngle;
                const endAngle = (index + 1) * segmentAngle;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                const x1 = 100 + 90 * Math.cos(startRad);
                const y1 = 100 + 90 * Math.sin(startRad);
                const x2 = 100 + 90 * Math.cos(endRad);
                const y2 = 100 + 90 * Math.sin(endRad);
                
                const textAngle = startAngle + segmentAngle / 2;
                const textRad = (textAngle - 90) * (Math.PI / 180);
                const textX = 100 + 60 * Math.cos(textRad);
                const textY = 100 + 60 * Math.sin(textRad);

                return (
                  <g key={index}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="15" fill="white" />
            </svg>
          </div>

          {/* Result */}
          {result && !spinning && (
            <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg animate-bounce">
              <p className="font-bold text-lg">You won!</p>
              <p className="text-2xl font-black">{result.value}</p>
            </div>
          )}

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={spinning || hasSpun}
            size="lg"
            className="w-full max-w-xs"
          >
            {spinning ? (
              <>
                <RotateCw className="w-4 h-4 mr-2 animate-spin" /> Spinning...
              </>
            ) : hasSpun ? (
              "Already spun today"
            ) : (
              "Spin Now"
            )}
          </Button>

          {hasSpun && (
            <p className="text-sm text-muted-foreground text-center">
              Come back tomorrow to spin again!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
