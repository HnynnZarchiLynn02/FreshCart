
import React, { useState, useEffect } from 'react';
import { GroceryItem, Category } from '../types';
import { CATEGORIES, Icons } from '../constants';
import { autoCategorize } from '../services/geminiService';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<GroceryItem>) => void;
  editingItem?: GroceryItem | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSave, editingItem }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [isCategorizing, setIsCategorizing] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setNote(editingItem.note || '');
      setCategory(editingItem.category);
    } else {
      setName('');
      setNote('');
      setCategory('Other');
    }
  }, [editingItem, isOpen]);

  const handleAutoCategorize = async () => {
    if (!name.trim()) return;
    setIsCategorizing(true);
    const suggestedCategory = await autoCategorize(name);
    setCategory(suggestedCategory);
    setIsCategorizing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, note, category });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleAutoCategorize}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="e.g. Almond Milk"
                required
              />
              {isCategorizing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              placeholder="e.g. 2 liters, organic if available"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
          >
            {editingItem ? 'Update Item' : 'Add to List'}
          </button>
        </form>
      </div>
    </div>
  );
};
