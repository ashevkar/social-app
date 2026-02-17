# ✨ Orkut Social App (Next.js) ✨

This is a web application built with Next.js, inspired by social platforms like Orkut. It allows users to sign up, log in, post messages, view a feed, like messages, and manage their profile. 🚀

## ⚙️ How It Works

The application uses the Next.js App Router structure.

* **🖥️ Frontend:** Built with React and styled using Tailwind CSS. Components handle UI elements like the tweet feed, individual tweet cards, login/signup forms, profile pages, etc. Client-side logic interacts with the backend API to fetch data and perform actions.
* **🔩 Backend (API):** Implemented using Next.js Route Handlers within the `src/app/api/` directory. These handlers define endpoints for various actions.
* **🔒 Authentication:** Handled by NextAuth.js using a Credentials provider (email/password). Session management uses JWTs, secured by the `NEXTAUTH_SECRET`.
* **💾 Database:** Prisma acts as the ORM (Object-Relational Mapper) to interact with the database. It defines the schema (User, Tweet, Like, Comment, Follow) and provides tools for database migrations and queries. The database itself is likely PostgreSQL.

## ➡️ Data Flow / User Experience

This section describes the typical journey a user takes through the application:

1.  **🏠 Main page (no login required):**
    * Anyone can visit the main page and see the feed layout (navbar, tweet feed, search bar).
    * **Guests** see a "Login or Sign up" prompt and can browse tweets; author names/usernames are not clickable.
    * **Logged-in users** see the full feed, can post, and can click any author's name or @username to view that user's profile.
2.  **🔑 Authentication:**
    * Sign up via the Sign Up page (`Create` User operation ✨). Log in using credentials (`Read` User operation ✔️). NextAuth.js handles sessions.
3.  **📰 Core interaction (logged in):**
    * **Feed:** View recent tweets (`Read` Tweet 👀). Tabs: Recent Tweets / My Series.
    * **Tweeting:** Create tweets (`Create` Tweet ✍️). Errors (e.g. Unauthorized) are shown inline.
    * **Tweet management:** Delete your own tweets (`Delete` Tweet 🗑️). **Liking:** Like/unlike tweets (`Create`/`Delete` Like ❤️).
4.  **👤 User profiles:**
    * **View another user:** Click a name or @username in the feed or search. The center content switches to that user's profile (same navbar and search bar). URL: `/?profile=userId`. "Back to feed" returns to the feed. Only logged-in users can open profiles.
    * **Your profile & settings:** Sidebar → Profile, Settings. Edit account, change password, appearance (sidebar color), delete account.
5.  **🔔 Notifications:**
    * Notifications tab (logged-in only) currently shows "Notifications are temporarily disabled."
6.  **⚙️ Settings:** Change password, appearance, delete account (`Delete` User ❌).
7.  **👋 Logout:** Via sidebar; session cleared via NextAuth.js.

The application demonstrates **CRUD** operations for Users and Tweets via the Next.js API and Prisma.

## ✅ Features

* **🔑 User Authentication:**
    * Sign Up (`/api/auth/signup`)
    * Log In (`/api/auth/login` & NextAuth Credentials)
    * Session Management
* **🐦 Tweets:**
    * Create Tweets (`POST /api/tweets`)
    * View Tweet Feed (`GET /api/tweets`)
    * Delete Own Tweets (`DELETE /api/tweets/[id]`)
    * View Tweets tagging a user (`GET /api/tweets/tagged?username=...`)
* **❤️ Interactions:**
    * Like / Unlike Tweets (`POST /api/tweets/[id]/like`)
    * View Like Notifications (`GET /api/tweets/liked`)
    * *💬 Comment functionality modeled*
    * *➕ Follow functionality modeled*
* **👤 User Profiles:**
    * View own profile / update (`GET /api/profile`, `PUT /api/profile`)
    * View another user's profile (`GET /api/user/[id]` — requires auth; returns name, username, bio, profileImage, followers/following counts, their tweets)
    * Change Password (`POST /api/change-password`) — in Settings for logged-in users
    * Delete Account (`DELETE /api/user/[id]`)
* **🔧 Debugging:**
    * Database Connection Check (`GET /api/debug`)
    * Environment Variable Check (`GET /api/debug/env`)

## 💻 Technologies Used

* **Framework:** [Next.js](https://nextjs.org/) (v15.3.8, App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Authentication:** [NextAuth.js](https://next-auth.js.org/) (v4.24.11) - Credentials Provider
* **Database ORM:** [Prisma](https://www.prisma.io/) (v6.6.0)
* **Database:** [PostgreSQL](https://www.postgresql.org/) 🐘
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4) 🎨
* **Password Hashing:** [bcryptjs](https://github.com/dcodeIO/bcrypt.js) 🔒
* **UI:** [React](https://reactjs.org/) (v19), [React DOM](https://reactjs.org/docs/react-dom.html) (v19)
* **Icons:** [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/) ✨
* **Date Formatting:** [date-fns](https://date-fns.org/) 📅
* **Linting/Formatting:** ESLint, Prettier
* **Deployment:** Vercel ▲

## 🚀 Getting Started

### Prerequisites 🔧

* Node.js (>= 18.18 recommended for Next.js 15)
* npm, yarn, pnpm, or bun
* Access to a PostgreSQL database instance.

### Installation & Setup 📦

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install, pnpm install, bun install
    ```

3.  **Set up environment variables:** ⚙️
    * Create a file named `.env` in the root of the project.
    * Add the following variables, replacing the placeholder values:
        ```env
        # Example .env file
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" # Your PostgreSQL connection string
        NEXTAUTH_SECRET="YOUR_VERY_STRONG_RANDOM_SECRET_HERE" # Generate with: openssl rand -base64 32
        NEXTAUTH_URL="http://localhost:3000" # For development
        ```

4.  **Apply database migrations:** 🛠️
    * Ensure your database server is running and accessible.
    * Run Prisma migrations:
        ```bash
        npx prisma migrate dev
        ```
    * (Optional) Seed the database: `npx prisma db seed` (if you create a seed script).

### Running the Development Server ▶️

1.  **Start the server:**
    ```bash
    npm run dev
    # or yarn dev, pnpm dev, bun dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 UI & routing summary

* **Main page (`/`):** Feed + shared layout (left sidebar, center content, right search/trends). Center shows either the tweet feed or a user profile when `?profile=userId` is in the URL (logged-in only).
* **Sidebar:** Same on main page and when viewing a profile — Orkut logo, Home, Notifications, Profile, Settings, Login/Sign up or Logout. Right sidebar: search (tweets/users) and trends.
* **User profile view:** Triggered by clicking an author in the feed or a user in search; stays on `/` with `?profile=id`. `/user/[id]` redirects to `/?profile=[id]` for compatibility.
* **Guests:** Can see the feed; profile links are disabled; posting and profile viewing require login.

## ☁️ Deployment

This application is configured for deployment on [Vercel](https://vercel.com).

1.  Connect your Git repository to Vercel.
2.  Configure the Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - set to your production URL) in the Vercel project settings. 🔑
3.  Ensure the build command (`npm run build`) runs successfully.
4.  Vercel will handle the deployment! 🎉 Make sure your database is accessible from Vercel.