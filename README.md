<<<<<<< HEAD
# FreshCart
Grocery Lists
=======

# 🛒 FreshCart - Family Grocery Manager

FreshCart is a smart, collaborative grocery list application designed for families. It features real-time synchronization via Supabase and intelligent item suggestions powered by Google Gemini AI.

## ✨ Features

- **Real-time Collaboration**: Shared list across multiple family accounts.
- **AI Smart Suggestions**: Gemini AI suggests forgotten essentials based on your current list.
- **Auto-Categorization**: AI automatically categorizes items as you type.
- **Starter Essentials**: One-click "Seed Essentials" to jumpstart your shopping.
- **Responsive Design**: Mobile-first UI built with Tailwind CSS.
- **Secure Auth**: Individual family member logins.

## 🚀 Getting Started

### Prerequisites

1.  **Node.js**: Installed on your machine.
2.  **Supabase Account**: A free project at [supabase.com](https://supabase.com).
3.  **Google Gemini API Key**: Get one at [ai.google.dev](https://ai.google.dev).

### Supabase Database Setup

To make the app function, run the following SQL in your Supabase **SQL Editor**:

```sql
-- 1. Create the grocery items table
create table grocery_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  note text,
  category text default 'Other',
  is_purchased boolean default false,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- 2. Enable Realtime for live updates across devices
alter publication supabase_realtime add table grocery_items;

-- 3. Setup Row Level Security (RLS)
-- For a simple family app, allow authenticated users to perform all actions
alter table grocery_items enable row level security;

create policy "Allow all actions for authenticated users" 
on grocery_items for all 
to authenticated 
using (true);
```

### Environment Variables

Create a `.env` file in the root directory (this is ignored by Git):

```env
API_KEY=your_gemini_api_key_here
```

*Note: The Supabase URL and Anon Key are configured in `lib/supabase.ts`.*

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🛠️ Built With

- **React 19** - UI Library
- **Tailwind CSS** - Styling
- **Supabase** - Auth & Real-time Database
- **Google Gemini API** - AI Intelligence
- **ESM.sh** - Modern module loading

## 📝 License

Distributed under the MIT License.
>>>>>>> d9b5329 (Initial commit: FreshCart Family Grocery App)
