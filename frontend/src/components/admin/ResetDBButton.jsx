// 📁 src/components/admin/ResetDBButton.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ResetDBButton() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(null);

  const handleReset = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch("/api/admin/reset", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch (err) {
      setMessage("Erreur de réinitialisation.");
    }
    setConfirming(false);
  };

  return (
    <div className="space-y-3">
      {!confirming ? (
        <Button
          onClick={() => setConfirming(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Trash2 className="mr-2" size={16} />
          Réinitialiser la base
        </Button>
      ) : (
        <div className="bg-red-100 border border-red-300 p-4 rounded-xl text-sm text-red-800">
          <p className="mb-2">
            ⚠️ Cette action supprimera toutes les données. Confirmez-vous ?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirming(false)}
              className="border-gray-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleReset}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              Oui, supprimer tout
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
