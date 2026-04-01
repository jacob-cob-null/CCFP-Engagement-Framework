# CCFP Engagement Framework

A **Laravel** and **Inertia.js** web application designed for the **Center for Christian Formation and Praxis (CCFP)** to automate faculty attendance and point tracking.

---

### 🛠 Tech Stack
* **Backend:** [Laravel 11](https://laravel.com/)
* **Frontend:** [Inertia.js](https://inertiajs.com/) (Vue/React)
* **Database:** Supabase
---

### 🔑 Key Features
* **Digital Attendance:** Mobile-friendly check-ins to replace manual paper logs.
* **Dynamic Points:** Configurable scoring for various event types (Donations, Participation).
* **RBAC:** Tiered access for University (CCFP) and College-level administrators.
* **Audit Trail:** Immutable logging of all administrative actions for transparency.

---

### ⚙️ Setup & Installation

#### 1. Prerequisites
* **PHP 8.2+:** [Download PHP](https://www.php.net/downloads)
* **Composer:** [Official Installation Guide](https://getcomposer.org/download/)
* **Node.js & NPM:** [Download Node.js](https://nodejs.org/)

#### 2. Quick Start
```bash
# Clone and install dependencies
git clone <repo-url>
composer install
npm install

# Configuration
cp .env.example .env
php artisan key:generate

# Database & Launch
php artisan migrate
php artisan serve
# (In a separate terminal)
npm run dev
```

---

### 🎯 Project Goal
To eliminate manual transcription errors and provide a **Single Source of Truth (SSOT)** for institutional engagement data across the university.