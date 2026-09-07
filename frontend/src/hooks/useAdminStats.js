import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function useAdminStats({ year = new Date().getFullYear(), month = "" } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        const params = {};
        if (year) params.year = year;
        if (month) params.month = month;

        const res = await api.get("/admin/stats/resume", { params });
        if (!stop) setData(res.data);
      } catch (e) {
        if (!stop) setErr(e);
        console.error("Erreur stats/resume:", e);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [year, month]);

  return { data, loading, error: err };
}
