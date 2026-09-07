// 📁 src/components/ui/dialog.jsx
import React from "react";

export default function Dialog({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-md">
        <button onClick={onClose} className="float-right text-red-500">X</button>
        {children}
      </div>
    </div>
  );
}
