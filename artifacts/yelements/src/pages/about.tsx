import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Truck, Clock, Award, Star } from "lucide-react";

export default function About() {
  return (
    <AppLayout>
      <div className="relative overflow-hidden bg-slate-950 text-white py-24 px-4 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-6">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
            Institutional Supply Excellence
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            About <span className="text-teal-400">Yelements</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Your single-point enterprise partner for advanced laboratory glassware, surgical instrumentation, institutional stationery, and premier hygiene supplies.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-16 max-w-5xl space-y-20">
        {/* Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-border/60 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Verified Standards</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All laboratory instruments, medical equipment, and chemicals undergo comprehensive compliance vetting to ensure adherence to safety regulations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Priority Delivery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We manage a dedicated regional supply fleet to fulfill high-volume corporate and collegiate procurements with maximum timing precision.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">24/7 Operations</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our operations desks remain active at all times, responding instantly to emergency hospital orders or institutional restock requirements.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Narrative Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Fulfilling Corporate Supply Demands Since 2021
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              At Yelements, we recognized that procurement within academic setups and hospital networks is plagued by inconsistent vendor timelines, unverified product compliance, and complex tax handling. We created a unified digital marketplace designed exclusively for professional procurement managers.
            </p>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Today, we serve over 350 leading regional research centers, schools, and medical facilities, supplying everything from Borosilicate-3.3 flasks and surgical scissors to custom canteen orders.
            </p>
            <div className="flex gap-6 pt-4 border-t">
              <div>
                <p className="text-3xl font-extrabold text-teal-600">350+</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Institutions Served</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-indigo-600">12k+</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Products Shipped</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-rose-600">99.8%</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">SLA Fulfillment</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border aspect-video md:aspect-square">
            <img 
              src="https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=800&auto=format&fit=crop" 
              alt="Scientific research supplies distribution" 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
              <div className="flex items-center gap-1.5">
                <Award className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-200">Quality Assured</span>
              </div>
              <p className="font-bold text-sm">ISO 9001:2015 Procurement Network</p>
            </div>
          </div>
        </div>

        {/* Corporate Trust Banner */}
        <div className="rounded-3xl bg-slate-50 border p-8 md:p-12 text-center space-y-6">
          <div className="flex justify-center text-yellow-400 gap-1">
            {Array(5).fill(0).map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
          </div>
          <h3 className="text-2xl font-bold text-foreground">Trusted by Leading Medical and Academic Centers</h3>
          <blockquote className="text-muted-foreground text-sm max-w-2xl mx-auto italic">
            "Yelements has completely transformed how our clinical networks replenish disposable laboratory inventory and medical glassware. The customized discount levels are highly transparent and automatically applied during checkout."
          </blockquote>
          <p className="text-xs text-foreground font-bold uppercase tracking-widest">— Dr. Aravind Sharma, Director at Apex Research Laboratories</p>
        </div>

        {/* Founder & Owner Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-tr from-emerald-50/50 to-teal-50/30 rounded-3xl p-8 md:p-12 border border-emerald-100/60 shadow-sm">
          <div className="space-y-4">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-widest">
              Founder & Director
            </span>
            <h3 className="text-2xl font-bold text-foreground">Dr. Suresh Kumar Yele</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Dr. Suresh Kumar Yele is the founder and visionary behind Yelements. With a dedication to high-quality scientific instrumentation and seamless distribution, he has pioneered regional institutional supply networks.
            </p>
            <div className="space-y-2 pt-2 text-sm text-slate-700">
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Email:</span>
                <a href="mailto:skyoptixinternational@gmail.com" className="text-emerald-700 hover:underline">skyoptixinternational@gmail.com</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Mobile:</span>
                <a href="tel:+919290920349" className="text-emerald-700 hover:underline">+91 9290920349</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Address:</span>
                <span>Vijayawada, Andhra Pradesh, India</span>
              </p>
            </div>
          </div>
          <div className="w-full h-64 rounded-2xl overflow-hidden shadow-md border bg-white flex items-center justify-center p-6 text-center">
            <div className="space-y-3">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto shadow-inner">
                SY
              </div>
              <h4 className="font-extrabold text-lg text-slate-850">Dr. Suresh Kumar Yele</h4>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Founder & Chairman, Yelements Group</p>
              <div className="inline-flex items-center gap-1 text-amber-500 text-xs mt-1">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
