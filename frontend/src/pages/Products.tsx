// Página de productos — catálogo del tenant
import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  dimensions: string | null;
  use: string | null;
  isActive: boolean;
}

const useLabels: Record<string, string> = {
  particular:    '🏠 Particular',
  commercial:    '🏢 Comercial',
  institutional: '🏛️ Institucional',
  all:           '🌐 Todos',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map((p) => p.category))].sort();

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Productos</h2>
        <p className="text-gray-400 text-sm mt-1">{filtered.length} productos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-mono">{product.code}</p>
                  <p className="text-white font-medium text-sm mt-0.5">{product.name}</p>
                </div>
                {product.use && (
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full shrink-0">
                    {useLabels[product.use] ?? product.use}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-400">{product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}</p>
              {product.description && <p className="text-gray-400 text-xs line-clamp-2">{product.description}</p>}
              {product.dimensions && <p className="text-gray-500 text-xs">📐 {product.dimensions}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
