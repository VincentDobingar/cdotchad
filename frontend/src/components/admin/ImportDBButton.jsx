// 📁 src/components/admin/ImportDBButton.jsx
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportDBButton() {
  const fileRef = useRef();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("fichier", file);

    const token = localStorage.getItem("adminToken");

    try {
      setLoading(true);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch (err) {
      setMessage("Erreur lors de l'import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept=".sql,.csv"
        ref={fileRef}
        onChange={handleImport}
        className="hidden"
      />
      <Button
        onClick={() => fileRef.current.click()}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={loading}
      >
        <Upload className="mr-2" size={16} />
        {loading ? "Importation..." : "Importer une base"}
      </Button>

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
