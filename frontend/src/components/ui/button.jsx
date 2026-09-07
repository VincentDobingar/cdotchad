// 📁 src/components/ui/button.jsx
export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
