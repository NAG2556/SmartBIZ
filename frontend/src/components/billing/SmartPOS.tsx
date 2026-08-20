import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, CreditCard, Sparkles, Receipt, CheckCircle, Package } from 'lucide-react';
import { Customer, Product, Bill, BillItem } from '../../types';
import { productApi, billingApi } from '../../services/api';
import { PhoneLookupCard } from './PhoneLookupCard';
import { InvoiceModal } from './InvoiceModal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface SmartPOSProps {
  onOpenNewCustomerModal: (prefilledPhone: string) => void;
}

export const SmartPOS: React.FC<SmartPOSProps> = ({ onOpenNewCustomerModal }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  // Custom Item inputs
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [customItemUnit, setCustomItemUnit] = useState<string>('pcs');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productApi.list();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add catalog product to cart
  const handleAddProduct = (product: Product) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product_id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: round2(newQty * updated[existingIndex].unit_price),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            unit: product.unit,
            quantity: 1,
            unit_price: product.selling_price,
            subtotal: product.selling_price,
          },
        ];
      }
    });
  };

  // Add ad-hoc custom product
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice || parseFloat(customItemPrice) <= 0) {
      showToast('Please enter item name and valid price', 'warning');
      return;
    }
    const price = parseFloat(customItemPrice);
    setItems((prev) => [
      ...prev,
      {
        product_name: customItemName.trim(),
        unit: customItemUnit.trim() || 'item',
        quantity: 1,
        unit_price: price,
        subtotal: price,
      },
    ]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        subtotal: round2(newQty * updated[index].unit_price),
      };
      return updated;
    });
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        unit_price: newPrice,
        subtotal: round2(updated[index].quantity * newPrice),
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const round2 = (num: number) => Math.round(num * 100) / 100;

  // Calculated totals
  const subtotal = round2(items.reduce((sum, item) => sum + item.subtotal, 0));
  const totalAmount = round2(Math.max(0, subtotal - (discount || 0)));
  const creditDue = round2(Math.max(0, totalAmount - (amountPaid || 0)));
  const previousBalance = selectedCustomer?.outstanding_balance || 0;
  const newOutstandingBalance = round2(previousBalance + creditDue);

  // Quick Payment Buttons
  const handlePayFull = () => {
    setAmountPaid(totalAmount);
    setPaymentMethod('Cash');
  };
  const handlePayZero = () => {
    setAmountPaid(0);
    setPaymentMethod('Unpaid');
  };

  // Submit Bill
  const handleSubmitBill = async () => {
    if (!selectedCustomer) {
      showToast('Please identify or select a customer first', 'warning');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one product to the bill', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          unit: i.unit,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        discount_amount: discount || 0,
        amount_paid: amountPaid || 0,
        payment_method: paymentMethod,
        notes: notes || undefined,
      };

      const bill = await billingApi.create(payload);
      setCompletedBill(bill);
      setShowInvoiceModal(true);
      showToast(`Bill #${bill.bill_number} generated successfully!`, 'success');

      // Reset cart
      setItems([]);
      setDiscount(0);
      setAmountPaid(0);
      setNotes('');
      // Update selected customer balance
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              outstanding_balance: bill.new_outstanding_balance || 0,
            }
          : null
      );
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create bill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SMART CUSTOMER IDENTIFICATION CARD */}
      <PhoneLookupCard
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        onOpenNewCustomerModal={onOpenNewCustomerModal}
        currency={currency}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. LEFT: PRODUCT SELECTOR & CART ITEMS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quick Product Chips */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              Quick Add From Catalog
            </h4>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddProduct(p)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-500/50 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center gap-2 group"
                >
                  <span>{p.name}</span>
                  <span className="font-mono text-indigo-300 font-bold text-[11px]">
                    {currency}{p.selling_price}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-125 transition-transform" />
                </button>
              ))}
            </div>

            {/* Custom Line Item Adder */}
            <form onSubmit={handleAddCustomItem} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Or custom item name..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
              <input
                type="number"
                step="any"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value)}
                placeholder="Price"
                className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Current Bill Items Table */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                Bill Items ({items.length})
              </h4>
              {items.length > 0 && (
                <button
                  onClick={() => setItems([])}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No items added to bill yet. Click products above or add custom item.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{item.product_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {currency}{item.unit_price} / {item.unit}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/60 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQty(idx, parseFloat(e.target.value) || 0)}
                        className="w-10 text-center bg-transparent text-white font-mono font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Subtotal */}
                    <div className="w-20 text-right font-mono font-bold text-white">
                      {currency}{item.subtotal.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT: TOTALS, PAYMENT & CREDIT SUMMARY (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Bill Calculation & Payment
            </h4>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-white">{currency}{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between gap-2">
                <span>Discount ({currency}):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-xs text-white focus:border-indigo-500"
                />
              </div>

              {/* Grand Total */}
              <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-800 pt-2.5">
                <span>Total Bill Amount:</span>
                <span className="font-mono text-emerald-400">{currency}{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Amount Paid Now:</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handlePayFull}
                    className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md hover:bg-emerald-500/30"
                  >
                    Pay Full
                  </button>
                  <button
                    type="button"
                    onClick={handlePayZero}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md hover:bg-amber-500/30"
                  >
                    Credit All
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm text-white focus:border-indigo-500 font-bold"
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium focus:border-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Unpaid">Unpaid (Credit)</option>
                </select>
              </div>

              {/* Dynamic Credit & Outstanding Indicator */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>Current Credit Generated:</span>
                  <span className="font-mono font-bold">+{currency}{creditDue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Customer Previous Balance:</span>
                  <span className="font-mono">{currency}{previousBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-slate-800/80 pt-1.5 text-xs">
                  <span>New Outstanding Balance:</span>
                  <span className={`font-mono ${newOutstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {currency}{newOutstandingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Bill Notes */}
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes / bill remarks..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />

              {/* Generate Bill Button */}
              <button
                type="button"
                onClick={handleSubmitBill}
                disabled={submitting || !selectedCustomer || items.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Generate Bill & Save Transaction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* INVOICE MODAL POPUP */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        bill={completedBill}
      />
    </div>
  );
};
