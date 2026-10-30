// 📁 src/components/ui/PageHero.jsx
// Bandeau d'en-tête des pages intérieures (fond encre, halos rouges, titre Fraunces).
export default function PageHero({ label, title, intro, children }) {
  return (
    <header className="relative overflow-hidden bg-encre text-white">
      <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-rouge/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-rougeprofond/20 blur-3xl" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-20">
        {label && (
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-white/80">
            <span className="h-px w-8 bg-rouge" aria-hidden="true" />
            {label}
          </span>
        )}
        <h1 className="mt-4 font-display font-semibold leading-[1.08] text-4xl md:text-5xl lg:text-[3.5rem] max-w-3xl">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-2xl text-lg text-white/80 leading-relaxed">{intro}</p>}
        {children}
      </div>
    </header>
  );
}
