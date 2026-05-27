import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FlashSaleTimerProps {
  endTime: Date;
  productName?: string;
}

export default function FlashSaleTimer({ endTime, productName }: FlashSaleTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (isExpired) {
    return null;
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-lg p-2 min-w-[50px] text-center shadow-lg">
        <span className="text-2xl font-black">{value.toString().padStart(2, "0")}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1 font-medium">{label}</span>
    </div>
  );

  return (
    <Card className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white border-0 shadow-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white text-red-600 font-bold">FLASH SALE</Badge>
                {productName && <span className="font-bold text-sm">{productName}</span>}
              </div>
              <p className="text-xs text-white/90 mt-1">Limited time offer!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <div className="flex gap-2">
              {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="Days" />}
              <TimeBlock value={timeLeft.hours} label="Hrs" />
              <TimeBlock value={timeLeft.minutes} label="Mins" />
              <TimeBlock value={timeLeft.seconds} label="Secs" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
