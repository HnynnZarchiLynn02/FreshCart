
export type Category = 
  | 'Produce' 
  | 'Dairy' 
  | 'Meat' 
  | 'Bakery' 
  | 'Frozen' 
  | 'Pantry' 
  | 'Snacks' 
  | 'Beverages' 
  | 'Household' 
  | 'Other';

export interface GroceryItem {
  id: string;
  name: string;
  note?: string;
  category: Category;
  isPurchased: boolean;
  createdAt: number;
}

export type SortOption = 'alphabetical' | 'category' | 'date';
export type FilterOption = 'all' | 'pending' | 'purchased';
