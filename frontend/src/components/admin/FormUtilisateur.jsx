import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function FormUtilisateur() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'utilisateur',
    motdepasse: '',
    actif: true
  });

  useEffect(() => {
    if (id) {
      // Mode édition : charger l'utilisateur existant
      axios.get(`/api/utilisateurs/${id}`)
        .then(res => setForm({ ...res.data, motdepasse: '' }))
        .catch(() => toast.error("Erreur de chargement"));
    }
  }, [id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`/api/utilisateurs/${id}`, form);
        toast.success("Utilisateur modifié");
      } else {
        await axios.post('/api/utilisateurs', form);
        toast.success("Utilisateur ajouté");
      }
      navigate('/admin/utilisateurs');
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{id ? 'Modifier' : 'Ajouter'} un utilisateur</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block">Nom</label>
          <input
            type="text"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block">Prénom</label>
          <input
            type="text"
            name="prenom"
            value={form.prenom}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        {!id && (
          <div>
            <label className="block">Mot de passe</label>
            <input
              type="password"
              name="motdepasse"
              value={form.motdepasse}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>
        )}

        <div>
          <label className="block">Rôle</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="utilisateur">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="actif"
            checked={form.actif}
            onChange={handleChange}
            className="mr-2"
          />
          <label>Actif</label>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {id ? 'Modifier' : 'Ajouter'}
        </button>
      </form>
    </div>
  );
}
