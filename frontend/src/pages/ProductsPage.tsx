import React, { useState } from 'react';
import { Product } from '../types';
import { ProductList } from '../components/products/ProductList';
import { ProductModal } from '../components/products/ProductModal';
import { PriceHikeModal } from '../components/products/PriceHikeModal';

export const ProductsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [priceHikeProduct, setPriceHikeProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <ProductList
        key={refreshKey}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenEditModal={(p) => setEditingProduct(p)}
        onOpenPriceHikeModal={(p) => setPriceHikeProduct(p)}
      />

      <ProductModal
        isOpen={isAddModalOpen || !!editingProduct}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <PriceHikeModal
        isOpen={!!priceHikeProduct}
        onClose={() => setPriceHikeProduct(null)}
        product={priceHikeProduct}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
