import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';

const getImageUrl = (imagePath) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;

export default function Catalog() {
  const [categoryId, setCategoryId] = useState(null);
  const [page, setPage] = useState(1);
  const { products, loading, error, hasMore } = useProducts({ page, categoryId });
  const { categories } = useCategories();

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-4 flex gap-2">
        <select
          className="border rounded px-2 py-1"
          value={categoryId || ''}
          onChange={e => {
            setCategoryId(e.target.value || null);
            setPage(1);
          }}
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-500">Erro: {error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(prod => (
          <div key={prod.id} className="border rounded shadow p-4 flex flex-col">
            {prod.image_path && (
              <img
                src={getImageUrl(prod.image_path)}
                alt={prod.name}
                className="h-40 object-cover mb-2 rounded"
              />
            )}
            <div className="font-bold text-lg">{prod.name}</div>
            <div className="text-neutral-600 mb-1">{prod.categories?.name}</div>
            <div className="mb-2 text-sm">{prod.description}</div>
            <div className="font-semibold text-marsala">R$ {Number(prod.price).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >Anterior</button>
        <span>Página {page}</span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore || loading}
        >Próxima</button>
      </div>
    </div>
  );
} 