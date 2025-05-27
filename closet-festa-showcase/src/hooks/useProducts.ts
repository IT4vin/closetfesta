import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProducts({ page = 1, pageSize = 12, categoryId = null } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (categoryId) query = query.eq('category_id', categoryId);
    query.then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setProducts(data);
      setHasMore(data.length === pageSize);
      setLoading(false);
    });
  }, [page, pageSize, categoryId]);

  return { products, loading, error, hasMore };
} 