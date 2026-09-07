// 📁 src/components/ui/Loader.jsx
import { Loader2 } from "lucide-react";

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-sm">Chargement en cours...</span>
    </div>
  );
};

export default Loader;
