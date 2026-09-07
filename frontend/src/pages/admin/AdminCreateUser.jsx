import { useState } from "react";
import { toast } from "react-toastify";

export default function AdminCreateUser() {
  const [email, setEmail] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (motdepasse !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    if (motdepasse.length < 8) return toast.error("Mot de passe trop court (min. 8 caractères)");

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, motdepasse }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      toast.success("Admin créé !");
      setEmail("");
      setMotdepasse("");
      setConfirm("");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow p-6 rounded">
      <h2 className="text-xl font-bold mb-4 text-red-700">Créer un compte admin</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" />
        <input type="password" required placeholder="Mot de passe" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} className="w-full border p-2 rounded" />
        <input type="password" required placeholder="Confirmer mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full border p-2 rounded" />
        <button type="submit" className="w-full bg-red-700 text-white py-2 rounded hover:bg-red-800">Créer</button>
      </form>
    </div>
  );
}
