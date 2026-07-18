import { useEffect, useRef } from 'react';
import { animate, svg, stagger, spring } from 'animejs';
import { Camera, Newspaper, Bus, PlaneTakeoff } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: <Camera className="h-5 w-5" />,
    title: 'Upload & Cluster',
    description: 'Drop in your travel photos — automatically grouped into days by location and timestamp.',
  },
  {
    step: '02',
    icon: <Newspaper className="h-5 w-5" />,
    title: 'AI Narrative',
    description: 'Our correspondent researches the weather, landmarks, and history of each stop to write a magazine-style feature.',
  },
  {
    step: '03',
    icon: <Bus className="h-5 w-5" />,
    title: 'Route Map & Stats',
    description: 'See your journey traced on a map with distance, countries, and conditions summarised at a glance.',
  },
  {
    step: '04',
    icon: <PlaneTakeoff className="h-5 w-5" />,
    title: 'Listen & Export',
    description: 'Hear each day narrated aloud, share a story card, or export the whole trip as a keepsake edition.',
  },
];

/**
 * How It Works — animejs v4.
 *
 * When the section scrolls into view:
 *  1. Three SVG connector paths draw from left → right using
 *     svg.createDrawable + animate({ draw: ['0 0', '0 1'] }).
 *  2. Step-number circles pop in via spring() easing, staggered.
 *  3. Feature cards fade + slide up, staggered slightly behind.
 */
export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Set initial hidden state for circles + cards
    for (const el of circleRefs.current) {
      if (el) { el.style.opacity = '0'; el.style.transform = 'scale(0.5)'; }
    }
    for (const el of cardRefs.current) {
      if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(28px)'; }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      // ── 1. Draw the three connector lines ──────────────────────────
      // svg.createDrawable returns an array of drawable proxies; we pass
      // the <svg> element as the scope so the selector stays local.
      const drawables = svg.createDrawable(
        svgRef.current!.querySelectorAll<SVGPathElement>('.connector'),
      );
      animate(drawables, {
        draw: ['0 0', '0 1'],
        ease: 'inOutQuad',
        duration: 900,
        delay: stagger(180),
      });

      // ── 2. Pop the step circles with spring easing ────────────────
      animate(
        circleRefs.current.filter((el): el is HTMLDivElement => el !== null),
        {
          opacity: [0, 1],
          scale: [0.5, 1],
          ease: spring({ mass: 0.8, stiffness: 200, damping: 14 }),
          delay: stagger(120, { start: 100 }),
        },
      );

      // ── 3. Stagger the feature cards up ──────────────────────────
      animate(
        cardRefs.current.filter((el): el is HTMLDivElement => el !== null),
        {
          opacity: [0, 1],
          translateY: [28, 0],
          ease: 'outExpo',
          duration: 700,
          delay: stagger(110, { start: 320 }),
        },
      );
    }, { threshold: 0.2 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-indigo-200/60"
      style={{ background: 'hsl(243 40% 97%)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Section label */}
        <div className="px-6 py-5 border-b border-indigo-200/60 flex items-baseline justify-between">
          <h2 className="font-serif font-black text-sm uppercase tracking-tight text-foreground">
            How It Works
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">4 Steps</span>
        </div>

        {/* Connector row — circles + SVG lines overlaid */}
        <div className="relative px-8 pt-10">
          {/* Step number circles */}
          <div className="grid grid-cols-4 gap-0">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex justify-center">
                <div
                  ref={el => { circleRefs.current[i] = el; }}
                  className="relative z-10 w-11 h-11 rounded-full border-2 border-primary bg-background flex items-center justify-center shadow-sm"
                >
                  <span className="font-mono text-[10px] font-bold text-primary tracking-widest">
                    {s.step}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* SVG connector paths — sit between the circles
              Circle centres at 12.5% / 37.5% / 62.5% / 87.5% of the row.
              In a viewBox of 0–1000 those are x = 125, 375, 625, 875.
              Circle radius ≈ 22px; lines start/end 26 units away from each centre.
              vector-effect="non-scaling-stroke" keeps stroke-width pixel-exact. */}
          <svg
            ref={svgRef}
            aria-hidden
            className="absolute inset-x-8 top-10 pointer-events-none"
            style={{ height: '44px' }}
            viewBox="0 0 1000 44"
            preserveAspectRatio="none"
          >
            {/* Each path starts hidden; createDrawable + animate will reveal it */}
            <path
              className="connector"
              d="M 152 22 L 348 22"
              stroke="hsl(243 55% 65%)"
              strokeWidth="1.5"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="connector"
              d="M 402 22 L 598 22"
              stroke="hsl(243 55% 65%)"
              strokeWidth="1.5"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="connector"
              d="M 652 22 L 848 22"
              stroke="hsl(243 55% 65%)"
              strokeWidth="1.5"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Feature cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-indigo-200/60">
          {STEPS.map((s, i) => (
            <div
              key={s.step}
              ref={el => { cardRefs.current[i] = el; }}
              className="p-8 md:p-10 space-y-4 border-b border-indigo-200/60 md:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground border border-border px-2 py-1">
                  {s.step}
                </span>
                <div className="text-primary">{s.icon}</div>
              </div>
              <h3 className="text-xl font-serif font-black text-foreground">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{s.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
