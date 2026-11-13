# CreativeHub ✦ Personal Cloud Studio & Digital Asset Vault

> A modern, responsive digital asset management vault and creative screening studio built with **React 19**, **Vite**, and **Supabase**. Collect, preview, organize, and showcase multimedia assets across customizable visual atmospheres.

---

## ✨ Highlights & Features

### 🎨 Three Distinct Design Atmospheres
- **Style 1: The Serene Sanctuary**  
  Calming zen aesthetic with soft glassmorphism, nature-inspired backdrops (*Twilight Lake*, *Misty Dawn*, *Forest Sanctuary*), and organic earth tones.
- **Style 2: The Tactile Atelier**  
  Editorial, architectural gallery experience featuring tactile ceramic tiles, warm sunlit studio backdrops (*Mirror Sea*, *Silk Dunes*, *Cloud Pavilion*), and warm terracotta accents.
- **Style 3: The Cosmic Observatory (Galaxy Theme)**  
  High-contrast, deep-space cosmic experience featuring authentic astronomical wallpapers:
  - **Violet Nebula:** Organic cosmic emission nebula in deep space.
  - **Andromeda Galaxy (M31):** Grand sweeping spiral galaxy with glowing galactic nucleus and sapphire star clusters.
  - **Webb Deep Field (SMACS 0723):** Relativistic deep-field cosmos with spacetime gravitational lensing arcs and ancient amber galaxies.

### 🏷️ Responsive Stacked Category Ribbon
- Clean, multi-tier auto-stacking category cards (`minmax(210px, 1fr)`).
- Complete font rendering with zero text truncation or ellipsis (*"Background Videos"*, *"Visual Effects"*, *"Audio & Music"*).
- Unclipped border transitions on hover across all viewports.

### 🔐 Secure Creative Vault & Authentication
- Supabase Row Level Security (RLS) ensuring each user's assets remain strictly private.
- Interactive password reveal toggle with state-aware icon indicator (open eye without slash when password is revealed, slashed eye when obscured).
- Built-in one-click demo preview mode for instant interactive portfolio evaluation.

### 📁 Media Support & Library Capabilities
- **Multimedia Asset Support:** Images, video clips, background motion graphics, audio & music, visual effects, 3D textures, and inspiration URLs.
- **Tagging & Collections:** Organize assets into thematic moodboards and custom disciplinary tags.
- **Search & Filtering:** Real-time search by title, tag, category, and file format.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, React Router v7, Vite 8
- **Icons:** Lucide React
- **Backend / Database:** Supabase (Auth, Postgres Database with RLS, Storage Buckets)
- **Styling:** CSS Design Tokens, Glassmorphism, CSS Grid, Responsive Design

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/teehueleng123/CreativeHub.git
cd CreativeHub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and add your Supabase credentials:
```bash
cp .env.example .env
```
Fill in your Supabase project keys in `.env`:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
```

---

## 📄 License
ISC License · Created with passion for creative professionals.
