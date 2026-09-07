// 📁 components/ui/Modal.jsx
import React from "react";

export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow p-6 max-w-3xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-2xl font-bold"
          title="Fermer"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export const ModalTrigger = ({ children }) => children;
export const ModalContent = ({ children }) => children;
