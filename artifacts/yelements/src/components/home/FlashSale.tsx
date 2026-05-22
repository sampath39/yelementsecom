import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Timer, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const flashProducts = [
  {
    id: 101,
    name: "Digital Blood Pressure Monitor",
    price: 1499,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop",
    totalStock: 50,
    leftStock: 2,
  },
  {
    id: 102,
    name: "Surgical Grade N95 Masks (Pack of 50)",
    price: 499,
    originalPrice: 999,
    image: "https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=600&auto=format&fit=crop",
    totalStock: 100,
    leftStock: 15,
  },
  {
    id: 103,
    name: "Binocular Compound Microscope",
    price: 12900,
    originalPrice: 18500,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop",
    totalStock: 20,
    leftStock: 5,
  },
  {
    id: 104,
    name: "Heavy Duty Floor Scrubber",
    price: 8995,
    originalPrice: 12995,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
    totalStock: 30,
    leftStock: 1,
  }
];

export function FlashSale() {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  return (
    <section className="py-12 bg-rose-50/50 dark:bg-rose-950/20">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-rose-500 text-white p-3 rounded-2xl shadow-lg animate-pulse">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2">
                Flash Sale
              </h2>
              <p className="text-muted-foreground text-sm">Hurry! Offers end soon.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-rose-500" />
            <div className="flex gap-2">
              <div className="bg-background border border-border shadow-sm px-3 py-1.5 rounded-lg text-lg font-mono font-bold">
                {formatTime(timeLeft.hours)}
              </div>
              <span className="text-xl font-bold text-rose-500 animate-pulse">:</span>
              <div className="bg-background border border-border shadow-sm px-3 py-1.5 rounded-lg text-lg font-mono font-bold">
                {formatTime(timeLeft.minutes)}
              </div>
              <span className="text-xl font-bold text-rose-500 animate-pulse">:</span>
              <div className="bg-background border border-border shadow-sm px-3 py-1.5 rounded-lg text-lg font-mono font-bold text-rose-500">
                {formatTime(timeLeft.seconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashProducts.map(product => {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            const stockPercent = (product.leftStock / product.totalStock) * 100;
            const isAlmostGone = product.leftStock <= 5;

            return (
              <div key={product.id} className="bg-background border border-border rounded-2xl p-4 hover:shadow-xl transition-all duration-300 group relative">
                {/* Discount Badge */}
                <div className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                  {discount}% OFF
                </div>

                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-secondary flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>

                <Link href="/products" className="block">
                  <h3 className="font-bold text-foreground truncate hover:text-primary transition-colors">{product.name}</h3>
                </Link>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-black text-foreground">₹{product.price.toLocaleString()}</span>
                  <span className="text-sm font-medium text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                </div>

                {/* Stock Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className={isAlmostGone ? "text-rose-500 animate-pulse" : "text-muted-foreground"}>
                      {isAlmostGone ? `Only ${product.leftStock} left!` : "Available"}
                    </span>
                    <span className="text-muted-foreground">{stockPercent.toFixed(0)}% Claimed</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isAlmostGone ? 'bg-rose-500' : 'bg-orange-500'}`}
                      style={{ width: `${100 - stockPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" className="rounded-full px-8 font-semibold gap-2 border-primary/20 hover:bg-primary/5">
            View All Offers <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
