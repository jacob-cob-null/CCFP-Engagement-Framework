# CCFP Engagement Framework

A **Laravel** and **Inertia.js** web application designed for the **Center for Christian Formation and Praxis (CCFP)** to automate faculty attendance and point tracking using a **Supabase** backend.

---

### 🛠 Tech Stack
* **Backend:** [Laravel 13](https://laravel.com/) (Proxy Architecture)
* **Frontend:** [React / Inertia.js](https://inertiajs.com/)
* **Database:** [Supabase](https://supabase.com/) (Postgres)
* **Auth:** Supabase Auth (JWT Verified in Laravel)

---

### ⚙️ Setup & Installation

#### 1. Prerequisites
* **PHP 8.5+:** (Required for Postgres Transaction Pooler support). Ensure `pdo_pgsql` is enabled.
* **Composer:** [Official Installation Guide](https://getcomposer.org/download/)
* **Node.js & NPM:** [Download Node.js](https://nodejs.org/)

#### 2. Configuration
1. Clone the repository and install dependencies:
   ```bash
   composer install
   npm install
   ```
2. Create your environment file:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
3. **Important**: Open `.env` and fill in your Supabase credentials:
   - `SUPABASE_URL` & `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Keep this secure!)
   - `SUPABASE_JWT_SECRET` (Found in Supabase API settings)
   - `SUPABASE_DB_*` connection details.

#### 3. First-Time Admin Setup (Bootstrap)
Since public registration is disabled, you must manually promote your first admin:
1. Create a user manually in your **Supabase Dashboard** (Authentication > Users).
2. Copy the **User ID (UUID)** of the new user.
3. Run the following command in your terminal:
   ```bash
   php artisan supabase:seed-roles --admins="YOUR-USER-UUID"
   ```

#### 4. Running the Application
This project requires both the Laravel backend and Vite frontend to be running. I've added a shortcut that handles both using the correct PHP 8.5 environment:

```bash
npm run dev:supabase
```
*The app will be available at http://localhost:5173 (Vite) and your API at http://localhost:8000.*

---

### 🛡 Architecture & Security
This application uses a **Proxy Model**:
- **Authentication**: Handled by Supabase. Laravel verifies the JWT on every request.
- **Data Access**: All data requests go through Laravel controller "wrappers" for validation.
- **RLS**: Row-Level Security is enforced at the database level using user context passed from Laravel to Postgres.

---

### 🎯 Project Goal
To provide a **Single Source of Truth (SSOT)** for institutional engagement data across the university, eliminating manual errors and centralizing faculty tracking.