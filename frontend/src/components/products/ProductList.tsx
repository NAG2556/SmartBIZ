import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, Edit3, Trash2, Megaphone, Tag, AlertCircle, Wrench } from 'lucide-react';
import { Product } from '../../types';
import { productApi } from '../../services/api';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface ProductListProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenPriceHikeModal: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenPriceHikeModal,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, search]);

  const loadCategories = async () => {
    try {
      const cats = await productApi.listCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.list({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: search.trim() || undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      await productApi.delete(id);
      showToast('Product removed from catalog', 'success');
      loadProducts();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, services, categories..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product / Service</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Items ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading catalog items...
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No Items Found"
            description="Add products or services to your catalog to enable fast billing."
            actionLabel="+ Add New Product"
            onAction={onOpenAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        {p.is_service ? (
                          <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span>{p.name}</span>
                      </div>
                      {p.description && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{p.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {currency}{p.selling_price.toFixed(2)} / {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {p.cost_price ? `${currency}${p.cost_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {p.is_service ? (
                        <Badge variant="info">Service</Badge>
                      ) : (
                        <span
                          className={`font-semibold ${
                            p.stock_quantity <= 5 ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          {p.stock_quantity} {p.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Price Hike Notification Button */}
                        <button
                          type="button"
                          onClick={() => onOpenPriceHikeModal(p)}
                          title="Update Price & Notify Past Buyers"
                          className="p-1.5 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg border border-indigo-500/20 transition-colors"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(p)}
                          title="Edit Item"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          title="Delete Item"
                          className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
