
import React from 'react';
import { GroceryItem } from '../types';
import { Icons, CATEGORY_COLORS } from '../constants';

interface GroceryItemCardProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: GroceryItem) => void;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({ item, onToggle, onDelete, onEdit }) => {
  return (
    <div 
      className={`group relative bg-white border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
        item.isPurchased ? 'opacity-60 bg-gray-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggle(item.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            item.isPurchased 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'bg-white border-gray-300 text-transparent hover:border-emerald-400'
          }`}
        >
          <Icons.Check />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-base font-medium truncate ${item.isPurchased ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {item.name}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other}`}>
              {item.category}
            </span>
          </div>
          {item.note && (
            <p className={`text-sm truncate ${item.isPurchased ? 'text-gray-400' : 'text-gray-500'}`}>
              {item.note}
            </p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Icons.Trash />
          </button>
        </div>
      </div>
    </div>
  );
};
