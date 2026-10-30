// 📁 src/components/ui/SectionHeading.jsx
// En-tête de section commun (étiquette rouge, titre Fraunces, introduction, lien « Tout voir »).
import { Link } from "react-router-dom";

export default function SectionHeading({ label, title, intro, to, align = "left" }) {
  const alignCls = align === "center" ? "text-center items-center mx-auto" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignCls} max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
      {label && (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-rouge">
          <span className="h-px w-6 bg-rouge/60" aria-hidden="true" />
          {label}
        </span>
      )}
      <h2 className="mt-3 font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-[1.1] text-encre">{title}</h2>
      {intro && <p className="mt-4 text-base md:text-lg text-graphite leading-relaxed">{intro}</p>}
      {to && (
        <Link
          to={to}
          className="mt-4 text-sm font-semibold text-rouge hover:text-rougeprofond underline-offset-4 hover:underline"
        >
          Tout voir
        </Link>
      )}
    </div>
  );
}
