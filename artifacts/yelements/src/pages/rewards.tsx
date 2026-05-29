import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Calendar, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RewardHistory {
  id: number;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface CheckinStatus {
  hasCheckedIn: boolean;
  streakDays: number;
}

interface SpinStatus {
  hasSpun: boolean;
}

export default function Rewards() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<RewardHistory[]>([]);
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [spinStatus, setSpinStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("yelements_token");
    if (!token) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";

      // Fetch balance
      const balanceRes = await fetch(`${apiUrl}/api/rewards/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const balanceData = await balanceRes.json();
      if (balanceData.success) setBalance(balanceData.balance);

      // Fetch history
      const historyRes = await fetch(`${apiUrl}/api/rewards/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyData = await historyRes.json();
      if (historyData.success) setHistory(historyData.data);

      // Fetch checkin status
      const checkinRes = await fetch(`${apiUrl}/api/rewards/checkin-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const checkinData = await checkinRes.json();
      if (checkinData.success) setCheckinStatus(checkinData);

      // Fetch spin status
      const spinRes = await fetch(`${apiUrl}/api/rewards/spin-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const spinData = await spinRes.json();
      if (spinData.success) setSpinStatus(spinData);
    } catch (err) {
      console.error("Failed to fetch rewards data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    const token = localStorage.getItem("yelements_token");
    if (!token) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/rewards/checkin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Checked in!", { description: data.message });
        fetchData();
      } else {
        toast.error("Check-in failed", { description: data.message });
      }
    } catch (err) {
      toast.error("Check-in failed", { description: "Something went wrong" });
    }
  };

  const handleSpin = async () => {
    const token = localStorage.getItem("yelements_token");
    if (!token) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/rewards/spin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Spin complete!", { 
          description: data.reward.type === "points" 
            ? `You won ${data.pointsAwarded} points!` 
            : `You won ${data.reward.value}` 
        });
        fetchData();
      } else {
        toast.error("Spin failed", { description: data.message });
      }
    } catch (err) {
      toast.error("Spin failed", { description: "Something went wrong" });
    }
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  const getRewardTypeBadge = (type: string) => {
    switch (type) {
      case "earned":
        return <Badge className="bg-emerald-100 text-emerald-700">Earned</Badge>;
      case "redeemed":
        return <Badge className="bg-red-100 text-red-700">Redeemed</Badge>;
      case "bonus":
        return <Badge className="bg-purple-100 text-purple-700">Bonus</Badge>;
      case "referral":
        return <Badge className="bg-blue-100 text-blue-700">Referral</Badge>;
      case "checkin":
        return <Badge className="bg-orange-100 text-orange-700">Check-in</Badge>;
      case "spin":
        return <Badge className="bg-pink-100 text-pink-700">Spin</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Rewards & Loyalty</h1>
          <p className="text-muted-foreground mt-1">Earn points and redeem rewards</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Points Balance Card */}
            <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-amber-100 font-semibold mb-2 uppercase tracking-wider text-xs">Available Points</p>
                    <h2 className="text-5xl font-black">{balance}</h2>
                  </div>
                  <Trophy className="w-16 h-16 text-amber-200" />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setLocation("/redeem")}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold flex-1"
                  >
                    Redeem Points
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Daily Check-in & Spin Wheel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Daily Check-in
                  </CardTitle>
                  <CardDescription>Check in daily to earn points</CardDescription>
                </CardHeader>
                <CardContent>
                  {checkinStatus && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {checkinStatus.hasCheckedIn ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">
                            {checkinStatus.hasCheckedIn ? "Already checked in today" : "Not checked in yet"}
                          </span>
                        </div>
                        <Badge variant="outline">{checkinStatus.streakDays} day streak</Badge>
                      </div>
                      {!checkinStatus.hasCheckedIn && (
                        <Button onClick={handleCheckin} className="w-full">
                          Check In Now
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" /> Spin Wheel
                  </CardTitle>
                  <CardDescription>Spin daily for a chance to win rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  {spinStatus && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {spinStatus.hasSpun ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">
                            {spinStatus.hasSpun ? "Already spun today" : "Spin available"}
                          </span>
                        </div>
                      </div>
                      {!spinStatus.hasSpun && (
                        <Button onClick={handleSpin} className="w-full">
                          Spin Now
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reward History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Points History
                </CardTitle>
                <CardDescription>Your recent point transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${item.points > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {item.points > 0 ? <TrendingUp className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getRewardTypeBadge(item.type)}
                          <span className={`font-bold ${item.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.points > 0 ? '+' : ''}{item.points}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-lg">
                    <Gift className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No reward history yet</h3>
                    <p className="text-muted-foreground mb-6">Start earning points by checking in daily!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
