import { motion } from "framer-motion";

export default function AdminCard({ titre, icone, description, contenu }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-200"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-red-600">{icone}</div>
        <h3 className="text-lg font-semibold text-gray-800">{titre}</h3>
      </div>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div>{contenu}</div>
    </motion.div>
  );
}
