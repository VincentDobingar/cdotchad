// ✅ AdminMessages.jsx version améliorée
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader, Trash2, FileDown, FileText, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Dialog from "@/components/ui/dialog";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreEmail, setFiltreEmail] = useState("");
  const [filtreDate, setFiltreDate] = useState("");
  const [page, setPage] = useState(1);
  const [messageActif, setMessageActif] = useState(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const messagesParPage = 10;

  const fetchMessages = () => {
    fetch("/cdobackend/api/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement messages:", err);
        setLoading(false);
      });
  };

  const supprimerMessage = async (id) => {
    if (!window.confirm("Confirmer la suppression de ce message ?")) return;
    try {
      await fetch(`/cdobackend/api/messages/${id}`, { method: "DELETE" });
      fetchMessages();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const messagesFiltres = messages.filter((m) => {
    const matchEmail = filtreEmail ? m.email.includes(filtreEmail) : true;
    const matchDate = filtreDate ? m.date_envoi.startsWith(filtreDate) : true;
    return matchEmail && matchDate;
  });

  const totalPages = Math.ceil(messagesFiltres.length / messagesParPage);
  const messagesAffiches = messagesFiltres.slice((page - 1) * messagesParPage, page * messagesParPage);

  const exporterCSV = () => {
    const header = ["Nom", "Email", "Message", "Date"];
    const rows = messagesFiltres.map((m) => [
      m.nom,
      m.email,
      m.message.replace(/\n/g, " ").replace(/;/g, ","),
      new Date(m.date_envoi).toLocaleString(),
    ]);
    const csv = [header, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `messages_contact_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exporterPDF = () => {
    const doc = new jsPDF();
    doc.text("Messages de contact", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Nom", "Email", "Message", "Date"]],
      body: messagesFiltres.map((m) => [
        m.nom,
        m.email,
        m.message.length > 50 ? m.message.slice(0, 50) + "..." : m.message,
        new Date(m.date_envoi).toLocaleString(),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [185, 28, 28] },
    });
    doc.save(`messages_contact_${Date.now()}.pdf`);
  };

  const ouvrirModale = (msg) => {
    setMessageActif(msg);
    setModaleOuverte(true);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <Card className="max-w-6xl mx-auto mt-12">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">📨 Messages reçus via le formulaire</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="text"
              placeholder="Filtrer par email"
              value={filtreEmail}
              onChange={(e) => setFiltreEmail(e.target.value)}
              className="px-3 py-1.5 border rounded"
            />
            <input
              type="date"
              value={filtreDate}
              onChange={(e) => setFiltreDate(e.target.value)}
              className="px-3 py-1.5 border rounded"
            />
            <button onClick={exporterCSV} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded">
              <FileDown size={16} /> CSV
            </button>
            <button onClick={exporterPDF} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded">
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader className="animate-spin mr-2" /> Chargement des messages...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:table w-full text-sm">
              <div className="hidden md:table-header-group">
                <div className="table-row">
                  <div className="table-cell font-semibold">Nom</div>
                  <div className="table-cell font-semibold">Email</div>
                  <div className="table-cell font-semibold">Message</div>
                  <div className="table-cell font-semibold">Date</div>
                  <div className="table-cell font-semibold">Actions</div>
                </div>
              </div>
              {messagesAffiches.map((msg) => (
                <div key={msg.id} className="table-row md:table-row border-t md:border-0 md:border-b">
                  <div className="table-cell py-2">{msg.nom}</div>
                  <div className="table-cell py-2">
                    {msg.email}
                    <div className="text-xs text-gray-400">
                      @{msg.email.split("@")[1]}
                    </div>
                  </div>
                  <div className="table-cell py-2 max-w-[300px] truncate">{msg.message}</div>
                  <div className="table-cell py-2">{new Date(msg.date_envoi).toLocaleString()}</div>
                  <div className="table-cell py-2 flex gap-2">
                    <button
                      onClick={() => ouvrirModale(msg)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Lire le message"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => supprimerMessage(msg.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {[...Array(totalPages).keys()].map((i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-1 rounded ${page === i + 1 ? "bg-red-700 text-white" : "bg-gray-200"}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ✅ MODALE DETAIL MESSAGE */}
        {modaleOuverte && messageActif && (
          <Dialog open={modaleOuverte} onOpenChange={setModaleOuverte}>
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-2">📨 Message de {messageActif.nom}</h3>
                <p className="text-sm text-gray-600 mb-1"><strong>Email :</strong> {messageActif.email}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Date :</strong> {new Date(messageActif.date_envoi).toLocaleString()}</p>
                <div className="mt-4 text-sm text-gray-800 whitespace-pre-line border-t pt-3">
                  {messageActif.message}
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={() => setModaleOuverte(false)}
                    className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
