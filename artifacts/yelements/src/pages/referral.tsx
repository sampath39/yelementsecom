import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Users, Gift, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Referral {
  id: number;
  status: string;
  pointsAwarded: number;
  createdAt: string;
  referredEmail?: string;
  referredName?: string;
}

export default function Referral() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("yelements_token");
    if (!token) return;

    try {
      // Fetch referral code
      const codeRes = await fetch("/api/referrals/my-code", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const codeData = await codeRes.json();
      if (codeData.success) setReferralCode(codeData.referralCode);

      // Fetch referrals
      const referralsRes = await fetch("/api/referrals/my-referrals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const referralsData = await referralsRes.json();
      if (referralsData.success) setReferrals(referralsData.data);
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!", { 
      description: "Share this code to earn 100 points for each successful signup." 
    });
  };

  const shareReferral = () => {
    const shareText = `Join Yelements and get 10% off your first order! Use my referral code: ${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Join Yelements",
        text: shareText,
        url: window.location.href,
      });
    } else {
      copyReferralCode();
    }
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "rewarded":
        return <Badge className="bg-blue-100 text-blue-700">Rewarded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
          <p className="text-muted-foreground mt-1">Invite friends and earn rewards</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Referral Code Card */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
              <CardContent className="pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-100 font-semibold mb-2 uppercase tracking-wider text-xs">Your Referral Code</p>
                    <h2 className="text-4xl font-black">{referralCode}</h2>
                  </div>
                  <Share2 className="w-16 h-16 text-blue-200" />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={copyReferralCode}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy Code
                  </Button>
                  <Button 
                    onClick={shareReferral}
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 hover:text-white font-bold flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" /> How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                      1
                    </div>
                    <h3 className="font-semibold mb-2">Share Your Code</h3>
                    <p className="text-sm text-muted-foreground">Share your unique referral code with friends and colleagues</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                      2
                    </div>
                    <h3 className="font-semibold mb-2">They Sign Up</h3>
                    <p className="text-sm text-muted-foreground">They use your code to create an account and get 10% off</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                      3
                    </div>
                    <h3 className="font-semibold mb-2">You Both Earn</h3>
                    <p className="text-sm text-muted-foreground">You get 100 points and they get their discount</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referrals List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Your Referrals
                </CardTitle>
                <CardDescription>People who signed up using your referral code</CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                            {referral.referredName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{referral.referredName || "Anonymous"}</p>
                            <p className="text-sm text-muted-foreground">
                              {referral.referredEmail || "No email"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(referral.status)}
                          {referral.pointsAwarded > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              +{referral.pointsAwarded} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-lg">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No referrals yet</h3>
                    <p className="text-muted-foreground mb-6">Start sharing your referral code to earn points!</p>
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
