
import React, { useState, useEffect, useMemo } from 'react';
import { GroceryItem, SortOption, FilterOption, Category } from './types';
import { Icons } from './constants';
import { GroceryItemCard } from './components/GroceryItemCard';
import { AddItemModal } from './components/AddItemModal';
import { getSmartSuggestions } from './services/geminiService';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { User } from '@supabase/supabase-js';

const STARTER_ITEMS = [
  { name: 'Milk', category: 'Dairy', note: '1 Gallon' },
  { name: 'Eggs', category: 'Dairy', note: 'Large, 1 dozen' },
  { name: 'Bread', category: 'Bakery', note: 'Sourdough or Whole Wheat' },
  { name: 'Apples', category: 'Produce', note: 'Gala or Honeycrisp' },
  { name: 'Spinach', category: 'Produce', note: 'Fresh bag' },
  { name: 'Chicken Breast', category: 'Meat', note: '1.5 lbs' },
  { name: 'Pasta', category: 'Pantry', note: 'Penne or Spaghetti' },
];

const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSeed: () => void;
  isSeeding: boolean;
}> = ({ isOpen, onClose, user, onSeed, isSeeding }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Settings</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                <p className="text-[10px] text-gray-500">Family Member</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tools</label>
            <button 
              onClick={onSeed}
              disabled={isSeeding}
              className="w-full py-3 px-4 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <Icons.Sparkles />
              <span>{isSeeding ? 'Seeding Essentials...' : 'Seed Starter Items'}</span>
            </button>
            <p className="mt-2 text-[11px] text-gray-400 px-1">Adds a curated list of staples (Milk, Eggs, Bread, etc.) to the shared list.</p>
          </div>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full py-3 px-4 border border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<User | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [suggestions, setSuggestions] = useState<{ name: string; category: Category }[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
      if (session) fetchItems();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
      if (session) fetchItems();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedItems: GroceryItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        note: item.note,
        category: item.category as Category,
        isPurchased: item.is_purchased,
        createdAt: new Date(item.created_at).getTime(),
      }));
      setItems(mappedItems);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_items' },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleAddItem = async (itemData: Partial<GroceryItem>) => {
    if (editingItem) {
      const { error } = await supabase
        .from('grocery_items')
        .update({
          name: itemData.name,
          note: itemData.note,
          category: itemData.category,
        })
        .eq('id', editingItem.id);
      
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('grocery_items')
        .insert([{
          name: itemData.name,
          note: itemData.note,
          category: itemData.category || 'Other',
          is_purchased: false,
          user_id: session?.id
        }]);

      if (error) alert(error.message);
    }
    setEditingItem(null);
  };

  const seedStarterItems = async () => {
    setIsSeeding(true);
    const payload = STARTER_ITEMS.map(item => ({
      ...item,
      is_purchased: false,
      user_id: session?.id
    }));

    const { error } = await supabase
      .from('grocery_items')
      .insert(payload);

    if (error) {
      alert("Failed to seed items: " + error.message);
    } else {
      if (isSettingsOpen) setIsSettingsOpen(false);
    }
    setIsSeeding(false);
  };

  const togglePurchased = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const { error } = await supabase
      .from('grocery_items')
      .update({ is_purchased: !item.isPurchased })
      .eq('id', id);
    
    if (error) alert(error.message);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', id);
    
    if (error) alert(error.message);
  };

  const clearPurchased = async () => {
    if (window.confirm('Remove all purchased items for everyone?')) {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('is_purchased', true);
      
      if (error) alert(error.message);
    }
  };

  const fetchSuggestions = async () => {
    setIsSuggesting(true);
    const suggested = await getSmartSuggestions(items);
    setSuggestions(suggested);
    setIsSuggesting(false);
  };

  const addSuggestedItem = (name: string, category: Category) => {
    handleAddItem({ name, category });
    setSuggestions(prev => prev.filter(s => s.name !== name));
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.note?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'purchased' && item.isPurchased) || 
                           (filter === 'pending' && !item.isPurchased);
      return matchesSearch && matchesFilter;
    });

    switch (sortBy) {
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'date':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return result;
  }, [items, searchQuery, filter, sortBy]);

  const stats = {
    total: items.length,
    pending: items.filter(i => !i.isPurchased).length,
    purchased: items.filter(i => i.isPurchased).length
  };

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <Icons.Cart />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">FreshCart</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-gray-500 font-medium">Shared family list</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
              {stats.pending} left
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              title="Settings"
            >
              <Icons.Settings />
            </button>
          </div>
        </div>

        {/* Search & Tools */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="text-sm border-none bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="purchased">Purchased</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border-none bg-gray-100 text-gray-600 font-semibold px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              <option value="date">By Date</option>
              <option value="alphabetical">A-Z</option>
              <option value="category">Category</option>
            </select>

            {stats.purchased > 0 && (
              <button 
                onClick={clearPurchased}
                className="text-sm bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 whitespace-nowrap"
              >
                Clear Done
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main List */}
      <main className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-gray-500 animate-pulse font-medium">Syncing family list...</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
               <Icons.Cart />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">List is empty</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-1 mb-8">Items added here appear on everyone's phone instantly.</p>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 max-w-sm mx-auto shadow-sm">
              <div className="flex justify-center mb-4 text-emerald-500">
                <Icons.Sparkles />
              </div>
              <h4 className="font-bold text-emerald-900 mb-2">Need a quick start?</h4>
              <p className="text-emerald-700/70 text-sm mb-6">Populate your list with a curated selection of household essentials.</p>
              <button 
                onClick={seedStarterItems}
                disabled={isSeeding}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSeeding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Essentials</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {filteredAndSortedItems.map((item) => (
              <GroceryItemCard
                key={item.id}
                item={item}
                onToggle={togglePurchased}
                onDelete={deleteItem}
                onEdit={(item) => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* AI Suggestions Section */}
        <section className="mt-8 border-t pt-8 pb-32">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500"><Icons.Sparkles /></span>
              <h2 className="text-lg font-bold text-gray-800">Smart Suggestions</h2>
            </div>
            <button 
              onClick={fetchSuggestions}
              disabled={isSuggesting}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            >
              {isSuggesting ? 'Thinking...' : 'Refresh'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.length === 0 && !isSuggesting && (
              <button 
                onClick={fetchSuggestions}
                className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-all text-sm font-medium"
              >
                Ask Gemini for suggestions
              </button>
            )}
            
            {isSuggesting && (
              <div className="w-full py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => addSuggestedItem(s.name, s.category)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex items-center gap-2"
              >
                <Icons.Plus /> {s.name}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* FAB - Add Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center pointer-events-none z-40 max-w-2xl mx-auto">
        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="pointer-events-auto h-16 px-8 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 font-bold text-lg"
        >
          <Icons.Plus />
          <span>Add Item</span>
        </button>
      </div>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddItem}
        editingItem={editingItem}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={session}
        onSeed={seedStarterItems}
        isSeeding={isSeeding}
      />
    </div>
  );
};

export default App;
