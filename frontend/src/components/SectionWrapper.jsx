// components/SectionWrapper.jsx
export default function SectionWrapper({ children, className = "" }) {
  return (
    <section className={`w-full px-6 py-16 ${className}`}>
      {children}
    </section>
  );
}