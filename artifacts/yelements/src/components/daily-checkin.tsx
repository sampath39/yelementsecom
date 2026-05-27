import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DailyCheckinProps {
  onCheckin: () => Promise<{ success: boolean; pointsEarned?: number; streakDays?: number; message?: string }>;
  hasCheckedIn: boolean;
  streakDays: number;
}

export default function DailyCheckin({ onCheckin, hasCheckedIn, streakDays }: DailyCheckinProps) {
  const [loading, setLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(streakDays);

  useEffect(() => {
    setCurrentStreak(streakDays);
  }, [streakDays]);

  const handleCheckin = async () => {
    if (loading || hasCheckedIn) return;

    setLoading(true);
    try {
      const response = await onCheckin();
      
      if (response.success) {
        toast.success("Checked in!", { 
          description: response.message 
        });
        setCurrentStreak(response.streakDays || currentStreak);
      } else {
        toast.error("Check-in failed", { description: response.message });
      }
    } catch (err) {
      toast.error("Check-in failed", { description: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const getStreakBonus = (days: number) => {
    const basePoints = 5;
    const bonus = Math.min(days * 5, 45); // Max bonus of 45 points (streak of 9+ days)
    return basePoints + bonus;
  };

  const getStreakColor = (days: number) => {
    if (days >= 7) return "from-purple-500 to-pink-500";
    if (days >= 5) return "from-blue-500 to-cyan-500";
    if (days >= 3) return "from-green-500 to-emerald-500";
    return "from-orange-500 to-yellow-500";
  };

  const pointsEarned = getStreakBonus(currentStreak);

  return (
    <Card className={`bg-gradient-to-r ${getStreakColor(currentStreak)} text-white border-0 shadow-lg`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" /> Daily Check-in
        </CardTitle>
        <CardDescription className="text-white/80">
          Check in daily to earn bonus points!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Streak Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${hasCheckedIn ? 'bg-white/20' : 'bg-white/30'} animate-pulse`}>
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Current Streak</p>
                <p className="text-3xl font-black">{currentStreak} days</p>
              </div>
            </div>
            <Badge className="bg-white text-orange-600 font-bold text-lg px-4 py-2">
              +{pointsEarned} pts
            </Badge>
          </div>

          {/* Streak Progress */}
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${Math.min((currentStreak / 7) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/80 text-center">
            {currentStreak >= 7 ? "Maximum streak bonus!" : `${7 - currentStreak} days to max bonus`}
          </p>

          {/* Check-in Button */}
          {hasCheckedIn ? (
            <div className="flex items-center justify-center gap-2 p-4 bg-white/20 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Already checked in today</span>
            </div>
          ) : (
            <Button
              onClick={handleCheckin}
              disabled={loading}
              className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold"
              size="lg"
            >
              {loading ? "Checking in..." : "Check In Now"}
            </Button>
          )}

          {/* Streak Bonuses Info */}
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs font-semibold mb-2 text-white/90">Streak Bonuses:</p>
            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              <div>
                <p className="font-bold">1 day</p>
                <p className="text-white/80">5 pts</p>
              </div>
              <div>
                <p className="font-bold">3 days</p>
                <p className="text-white/80">15 pts</p>
              </div>
              <div>
                <p className="font-bold">5 days</p>
                <p className="text-white/80">25 pts</p>
              </div>
              <div>
                <p className="font-bold">7+ days</p>
                <p className="text-white/80">50 pts</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
