import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { productApi } from '../../services/api';
import { Modal } from '../common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: (savedProduct: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [unit, setUnit] = useState('pcs');
  const [isService, setIsService] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setDescription(product.description || '');
      setSellingPrice(product.selling_price.toString());
      setCostPrice(product.cost_price?.toString() || '');
      setStockQuantity(product.stock_quantity.toString());
      setUnit(product.unit);
      setIsService(product.is_service);
    } else {
      setName('');
      setCategory('General');
      setDescription('');
      setSellingPrice('');
      setCostPrice('');
      setStockQuantity('0');
      setUnit('pcs');
      setIsService(false);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || parseFloat(sellingPrice) < 0) {
      showToast('Please provide valid product name and price', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || 'General',
        description: description.trim() || undefined,
        selling_price: parseFloat(sellingPrice),
        cost_price: costPrice ? parseFloat(costPrice) : 0,
        stock_quantity: isService ? 0 : parseFloat(stockQuantity) || 0,
        unit: unit.trim() || 'pcs',
        is_service: isService,
      };

      if (product) {
        const updated = await productApi.update(product.id, payload);
        showToast('Product details updated', 'success');
        onSuccess(updated);
      } else {
        const created = await productApi.create(payload);
        showToast(`Item "${created.name}" added to catalog!`, 'success');
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Item' : 'Add Product / Service'}
      subtitle="Configure catalogue items for instant POS billing"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle: Product vs Service */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setIsService(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isService ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Physical Product
          </button>
          <button
            type="button"
            onClick={() => setIsService(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isService ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Service / Labor
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Item Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Basmati Rice, Screen Repair"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Grocery, Electronics"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Unit (kg, pcs, hr, liter)
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="pcs"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Selling Price ({currency}) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-mono text-white focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Cost Price ({currency})
            </label>
            <input
              type="number"
              step="any"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-mono text-white focus:border-indigo-500"
            />
          </div>
        </div>

        {!isService && (
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Current Stock Quantity ({unit})
            </label>
            <input
              type="number"
              step="any"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:border-indigo-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            {submitting ? 'Saving...' : product ? 'Update Item' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
