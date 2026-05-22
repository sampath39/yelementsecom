import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    title: "THE GREAT SUPPLY FEST",
    subtitle: "Bulk Supplies. Best Offers.",
    highlight: "Best Offers.",
    description: "Equip your school, college, lab or hospital with top-tier scientific, medical, and office essentials. Flat institutional pricing, audited by Dr. Suresh Kumar Yele.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop",
    bgColor: "bg-emerald-50",
    buttonText: "SHOP NOW",
    link: "/products?sale=summer"
  },
  {
    id: 2,
    title: "FIRST BULK ORDER",
    subtitle: "First Bulk Order Delivery Free!",
    highlight: "Delivery Free!",
    description: "Ready to equip your facility? Get 100% free delivery on your very first bulk order. Auto-applied or use coupon code FREEBULK.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop",
    bgColor: "bg-teal-50",
    buttonText: "START PROCUREMENT",
    link: "/products?deal=flash"
  },
  {
    id: 3,
    title: "NEW COLLECTION",
    subtitle: "Premium Institutional Supplies.",
    highlight: "Supplies.",
    description: "Explore the latest arrivals in our catalog of high precision labware and surgical supplies.",
    image: "https://images.unsplash.com/photo-1581093588401-f3c22d66c2c9?q=80&w=2070&auto=format&fit=crop",
    bgColor: "bg-green-50",
    buttonText: "EXPLORE CATALOG",
    link: "/products?sort=new"
  }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mt-6 container mx-auto px-4 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl h-[450px] shadow-sm border border-emerald-100/50">
        {slides.map((slide, index) => {
          const titleParts = slide.subtitle.split(slide.highlight);
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 flex transition-opacity duration-1000 ease-in-out ${slide.bgColor} ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Content Side (Left) */}
              <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:pl-20 z-10 w-full md:w-[55%]">
                <span className="text-xs font-black uppercase tracking-widest text-primary mb-4">
                  {slide.title}
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-slate-800">
                  {titleParts[0]}
                  <span className="text-primary">{slide.highlight}</span>
                  {titleParts[1]}
                </h1>
                <p className="text-slate-600 mb-8 max-w-lg text-base md:text-lg leading-relaxed font-medium">
                  {slide.description}
                </p>
                <Button asChild size="lg" className="w-fit bg-primary text-white hover:bg-primary/90 font-bold px-8 h-12 shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all duration-300">
                  <Link href={slide.link}>{slide.buttonText}</Link>
                </Button>
              </div>

              {/* Image Side (Right) */}
              <div className="hidden md:flex w-[45%] relative h-full items-center justify-center p-8 lg:p-12">
                <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-xl border border-white/20">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === currentSlide ? "w-8 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
