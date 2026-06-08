// Endless right-to-left image strip for the hero background.
// Pure CSS animation (no JS). Images are duplicated for a seamless loop.

const HERO_IMAGES = [1, 2, 3, 4, 5, 6];

export function HeroSlideshow() {
  const slides = [...HERO_IMAGES, ...HERO_IMAGES]; // duplicate -> seamless -50% loop

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-marquee flex h-full w-max">
        {slides.map((n, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`/hero/hero-${n}.jpg`}
            alt=""
            className="h-full w-[75vw] max-w-[560px] flex-none object-cover sm:w-[48vw]"
            decoding="async"
          />
        ))}
      </div>
    </div>
  );
}
