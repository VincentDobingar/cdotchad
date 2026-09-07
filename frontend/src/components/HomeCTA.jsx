// 📁 src/components/HomeCTA.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function HomeCTA() {
  return (
    <motion.section
      className="bg-gray-100 py-16 text-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-red-700 mb-8">
        Prêt à découvrir les opportunités ?
      </h2>
      <div className="flex justify-center gap-4 flex-wrap">
        <Link
          to="/offres"
          className="bg-white text-red-700 border border-red-600 hover:bg-red-100 font-semibold py-2 px-6 rounded-full transition"
        >
          Explorer les Offres
        </Link>
        <Link
          to="/contact"
          className="bg-red-600 text-white hover:bg-red-700 font-semibold py-2 px-6 rounded-full transition"
        >
          Contactez-nous
        </Link>
      </div>
    </motion.section>
  );
}
