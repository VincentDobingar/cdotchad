// src/pages/admin/AdminAjoutOffre.jsx
import AdminNavbar from "@/components/AdminNavbar";
import FormulaireOffreCDO from "@/components/admin/FormulaireOffreCDO";

export default function AdminAjoutOffre() {
  return (
    <>
      <AdminNavbar />
      <div className="pt-20 px-4">
        <FormulaireOffreCDO />
      </div>
    </>
  );
}