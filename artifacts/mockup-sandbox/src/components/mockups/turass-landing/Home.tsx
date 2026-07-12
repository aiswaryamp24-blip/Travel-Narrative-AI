import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Home() {
  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-primary">
      <div className="global-film-grain"></div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 mix-blend-difference text-white">
        <div className="font-display font-bold text-xl tracking-widest uppercase">Turass</div>
        <div className="flex gap-8 items-center text-sm font-medium tracking-wide">
          <a href="#story" className="hover:text-primary transition-colors">The Story</a>
          <a href="#how" className="hover:text-primary transition-colors">How it Works</a>
          <button className="border border-white/30 px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all duration-300">
            Start Journey
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <img 
            src="/__mockup/images/turass-hero-bg.png" 
            alt="Traveler looking at horizon" 
            className="w-full h-full object-cover object-center scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/10 to-background z-10"></div>
          <div className="absolute inset-0 bg-indigo-950/30 mix-blend-multiply z-10"></div>
        </motion.div>
        
        <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw] xl:text-[7.5vw] leading-[0.9] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 tracking-tighter mix-blend-overlay text-center px-4">
              YOUR
              <br />
              <span className="italic font-serif opacity-90 pl-[10%] sm:pl-[20%] block -mt-2 md:-mt-4 mix-blend-normal text-white text-[10vw] sm:text-[8vw] md:text-[7vw] lg:text-[6vw] xl:text-[5vw]">embedded</span>
              <span className="-mt-4 md:-mt-6 block break-words">CORRESPONDENT.</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="max-w-md mt-12 text-lg md:text-xl text-white/80 font-medium leading-relaxed"
          >
            Upload the photos from your trip. We'll write the story. 
            A personal foreign correspondent for your memories.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-16"
          >
            <button className="group relative px-8 py-4 bg-primary text-background font-bold tracking-widest uppercase text-sm overflow-hidden rounded-sm">
              <span className="relative z-10">Begin the Expedition</span>
              <div className="absolute inset-0 h-full w-full bg-white scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100 z-0"></div>
            </button>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20"
        >
          <span className="text-xs uppercase tracking-widest text-white/50">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
            <motion.div 
              animate={{ y: [0, 48] }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1/2 bg-white"
            />
          </div>
        </motion.div>
      </section>

      {/* The Problem / Contrast Section */}
      <section id="story" className="py-32 relative bg-background z-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-center">
            <div className="md:col-span-5 md:col-start-2">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
                ALBUMS ARE <span className="text-white/30 italic font-serif">silent.</span><br />
                STORIES <span className="text-primary italic font-serif">speak.</span>
              </h2>
              <div className="space-y-6 text-muted-foreground text-lg">
                <p>
                  You take hundreds of photos. They sit in a grid. A digital shoebox where memories fade into pixels.
                </p>
                <p className="text-white/90 font-medium">
                  Turass changes the medium.
                </p>
                <p>
                  We transform your raw camera roll into a narrated dispatch. Not just what you saw, but how it felt. The heat of the pavement, the taste of the espresso, the exhaustion and the awe.
                </p>
              </div>
            </div>
            
            <div className="md:col-span-5 relative">
              <div className="aspect-[4/5] relative w-full overflow-hidden rounded-sm film-grain group">
                <img 
                  src="/__mockup/images/turass-reference-embrace.png" 
                  alt="Couple embracing against sun-bleached sky" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to our generated image if reference isn't available
                    e.currentTarget.src = "/__mockup/images/turass-friends.png";
                  }}
                />
                <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="font-display text-2xl font-bold text-white text-shadow-md leading-tight">
                    "The wind off the Atlantic carried salt and something like a promise."
                  </p>
                  <p className="text-white/70 text-sm mt-4 font-mono uppercase tracking-widest">
                    — Dispatch from Lisbon, Oct '23
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / How it works */}
      <section id="how" className="py-32 relative overflow-hidden bg-[#0a0b14]">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="font-display text-5xl md:text-7xl font-bold max-w-2xl">
              THE <span className="italic font-serif text-primary">process</span> OF REMEMBRANCE.
            </h2>
            <p className="text-muted-foreground max-w-sm md:pb-3">
              Three steps from scattered photos to a lasting narrative.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            {/* Step 1 */}
            <div className="relative group">
              <div className="text-8xl font-display font-bold text-white/5 absolute -top-12 -left-6 z-0 group-hover:text-primary/10 transition-colors duration-500">01</div>
              <div className="relative z-10">
                <div className="h-[2px] w-12 bg-primary mb-8 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                <h3 className="text-2xl font-display font-bold mb-4">Drop the Roll</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No curation needed. Upload the good, the blurry, the mistakes. Our AI analyzes the visual metadata, timeframes, and geographic movement to understand the shape of your journey.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="text-8xl font-display font-bold text-white/5 absolute -top-12 -left-6 z-0 group-hover:text-primary/10 transition-colors duration-500">02</div>
              <div className="relative z-10">
                <div className="h-[2px] w-12 bg-primary mb-8 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                <h3 className="text-2xl font-display font-bold mb-4">The Correspondent Writes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Like a journalist embedding with your travel party. It weaves locations, weather data, and the emotional resonance of your images into a cohesive, beautifully written dispatch.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="text-8xl font-display font-bold text-white/5 absolute -top-12 -left-6 z-0 group-hover:text-primary/10 transition-colors duration-500">03</div>
              <div className="relative z-10">
                <div className="h-[2px] w-12 bg-primary mb-8 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                <h3 className="text-2xl font-display font-bold mb-4">Publish & Print</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Share the digital dispatch with friends who follow your travels, or export a stunning, magazine-quality PDF keepsake ready for the coffee table.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full width image break */}
      <section className="h-[70vh] w-full relative overflow-hidden flex items-center justify-center">
        <img 
          src="/__mockup/images/turass-landscape.png" 
          alt="Misty mountains at twilight" 
          className="absolute w-full h-full object-cover z-0" 
        />
        <div className="absolute inset-0 bg-background/40 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
        
        <h2 className="relative z-20 font-display text-[8vw] font-bold text-white/90 tracking-tighter mix-blend-overlay text-center uppercase leading-none">
          Leave<br/>a trace.
        </h2>
      </section>

      {/* Social / Following Section */}
      <section className="py-32 relative bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative h-[600px] w-full">
              {/* Stacked polaroid effect */}
              <div className="absolute top-10 left-10 w-[70%] aspect-[3/4] rounded-sm film-grain rotate-[-6deg] z-10 shadow-2xl border-8 border-white/5 bg-secondary/50 p-2">
                <img src="/__mockup/images/turass-journal.png" alt="Train window" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-10 right-10 w-[65%] aspect-square rounded-sm film-grain rotate-[4deg] z-20 shadow-2xl border-8 border-white/5 bg-secondary/50 p-2">
                <img src="/__mockup/images/turass-friends.png" alt="Friends at campfire" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-block border border-white/20 px-3 py-1 rounded-full text-xs tracking-widest uppercase mb-8 text-white/60">
                The Network
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-8">
                FOLLOW <span className="italic font-serif">the</span> EXPEDITIONS <span className="italic font-serif">of</span> OTHERS.
              </h2>
              <div className="space-y-6 text-muted-foreground text-lg">
                <p>
                  Social media is built for the highlight reel. Turass is built for the story.
                </p>
                <p>
                  Follow your friends' dispatches and receive quarterly "Wrapped" digests of the journeys happening in your circle. Read their travelogues the way you'd read a letter from afar.
                </p>
                
                <ul className="mt-8 space-y-4 font-medium text-white/80">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Curated dispatch feeds, not algorithmic timelines
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Quarterly expedition digests
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Ad-free, noise-free reading experience
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative bg-primary text-background overflow-hidden">
        {/* Abstract noise pattern for CTA */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <h2 className="font-display text-5xl md:text-7xl font-bold mb-8 max-w-4xl tracking-tight">
            YOUR NEXT CHAPTER IS WAITING TO BE WRITTEN.
          </h2>
          <p className="text-background/80 text-xl md:text-2xl mb-12 max-w-2xl font-medium">
            Join thousands of travelers documenting their journeys with the care they deserve.
          </p>
          
          <button className="group relative px-10 py-5 bg-background text-white font-bold tracking-widest uppercase text-sm rounded-sm overflow-hidden hover:shadow-2xl transition-all duration-300">
            <span className="relative z-10 group-hover:text-background transition-colors duration-300">Start Your Journal</span>
            <div className="absolute inset-0 h-full w-full bg-white scale-y-0 origin-bottom transition-transform duration-500 ease-out group-hover:scale-y-100 z-0"></div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background pt-20 pb-10 border-t border-white/5 relative z-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <div className="font-display font-bold text-3xl tracking-widest uppercase mb-6">Turass</div>
              <p className="text-muted-foreground max-w-sm">
                An AI travel-photo journal that writes the story of your journey. Your personal foreign correspondent.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold uppercase tracking-widest text-sm mb-6 text-white">Product</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">The App</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Print Keptseakes</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Network</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold uppercase tracking-widest text-sm mb-6 text-white">Company</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Journal</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs text-muted-foreground uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} Turass Expeditions.</p>
            <p className="mt-4 md:mt-0">The journey matters.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
