# 🚀 GitHub Profile Analyzer API (GitScope)

A professional, recruiter-grade REST API and interactive developer dashboard built with **Node.js, Express.js, MySQL, and the GitHub REST API**. It analyzes public GitHub developer profiles and generates actionable insights from repositories, languages, stars, forks, followers, and code updates.

🌐 **Live Deployed Dashboard**: [https://github-profile-analyzer-api-lbd6.onrender.com/](https://github-profile-analyzer-api-lbd6.onrender.com/)  
📖 **Live Interactive API Documentation (Swagger)**: [https://github-profile-analyzer-api-lbd6.onrender.com/api-docs](https://github-profile-analyzer-api-lbd6.onrender.com/api-docs)

---

## 📌 Features

* **Profile Analysis**: Fetch and parse public user details.
* **Repository Analytics**: Scan user repositories (up to 300 repos) to calculate total stars, total forks, and open issues.
* **Advanced Insights**:
  * Identify top programming language.
  * Determine the most popular repository.
  * Calculate follower-to-following ratio.
  * Compute average stars earned per repository.
  * Generate a repository activity score (based on update recency).
  * Calculate account age in years.
* **Storage**: Persistent analytics cached in a MySQL database.
* **Security & Performance**:
  * Internal request caching (`node-cache`) to prevent GitHub API rate-limiting.
  * HTTP security headers protection using `helmet`.
  * IP-based rate limiting via `express-rate-limit`.
  * Centralized error middleware.
* **Modern Developer Dashboard**: A responsive dark glassmorphic single-page portal served directly from the backend to search, delete, and view profiles.

---

## 📂 Project Structure

```bash
github-profile-analyzer-api/
│
├── src/
│   ├── config/
│   │   └── db.js                 # MySQL Pool & automated table migrator
│   ├── controllers/
│   │   └── profile.controller.js # Maps HTTP queries to database models/services
│   ├── middlewares/
│   │   ├── error.middleware.js   # Centralized JSON error catcher
│   │   └── rateLimiter.js        # IP rate limiter (100 requests per 15 mins)
│   ├── models/
│   │   └── profile.model.js      # Raw SQL queries wrapper (repository layer)
│   ├── routes/
│   │   └── profile.routes.js     # API endpoints declarations
│   ├── services/
│   │   └── github.service.js     # Axios requests query with node-cache & concurrent analysis
│   ├── utils/
│   │   └── calculateInsights.js  # Analytics computations logic
│   ├── app.js                    # Helmet, CORS, and Swagger UI configurations
│   └── server.js                 # App server launcher (default port: 5000)
│
├── sql/
│   └── schema.sql                # Database structure table definition
├── postman/
│   └── collection.json           # Importable API query collection
├── public/
│   ├── css/
│   │   └── style.css             # Glassmorphism neon stylesheet
│   ├── js/
│   │   └── main.js               # Client AJAX & UI rendering controller
│   └── index.html                # Single page application dashboard template
├── .env.example                  # Environment settings template
├── docker-compose.yml            # Docker container configurations for MySQL
├── package.json                  # NPM modules & start script properties
└── README.md                     # Current documentation file
```

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express.js (v5)
* **Database**: MySQL (v8)
* **Caching**: node-cache
* **External APIs**: GitHub REST API
* **Security**: Helmet, Express Rate Limit
* **Documentation**: Swagger UI
* **Testing**: Postman

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer

# Optional: GitHub token to increase API rate limits (recommended)
GITHUB_TOKEN=your_github_personal_access_token
```

---

## 🚀 Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/naina766/github-profile-analyzer-api.git
   cd github-profile-analyzer-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start MySQL database**:
   * If you have Docker, run:
     ```bash
     docker-compose up -d
     ```
   * Or ensure your local MySQL Server service is active.

4. **Run the application**:
   * For Development:
     ```bash
     npm run dev
     ```
   * For Production:
     ```bash
     npm start
     ```

Open **[http://localhost:5000](http://localhost:5000)** in your browser to load the dashboard.

---

## 📊 API Endpoints

### 1. Analyze GitHub Profile
Queries GitHub API, aggregates metrics, and caches them in the database.
* **HTTP Method**: `POST`
* **Route**: `/api/profiles/analyze/:username`
* **Example**: `POST /api/profiles/analyze/octocat`

### 2. Get All Profiles
Lists cached profiles from the database (supports `search`, `page`, `limit`, `sortBy`, `order`).
* **HTTP Method**: `GET`
* **Route**: `/api/profiles`

### 3. Get Registry Analytics
Aggregated database statistics (total users count, average followers, most common language, top follower developer).
* **HTTP Method**: `GET`
* **Route**: `/api/profiles/analytics`

### 4. Get Single Cache Profile
Returns cached details and calculated insights.
* **HTTP Method**: `GET`
* **Route**: `/api/profiles/:username`

### 5. Refresh Profile
Evicts memory caches and updates MySQL with fresh GitHub API data.
* **HTTP Method**: `PUT`
* **Route**: `/api/profiles/refresh/:username`

### 6. Delete Profile
* **HTTP Method**: `DELETE`
* **Route**: `/api/profiles/:username`

### 7. Health Check
* **HTTP Method**: `GET`
* **Route**: `/health`

---

## 🗄️ Database Schema

### github_profiles

Stores:
* `github_id` (Unique GitHub identifier)
* `username` (GitHub handle)
* `name` (Full name)
* `bio` (User description)
* `public_repos` (Repository count)
* `followers` / `following`
* `total_stars` / `total_forks`
* `top_language` (Most frequent primary language)
* `top_repo` (Most starred repository)
* `follower_following_ratio`
* `average_stars_per_repo`
* `repo_activity_score`
* `account_age_years`
* `organizations_count`
* `profile_url`
* `account_created_at`
* `analyzed_at` (Timestamp of last cache)

---

## 🧪 Testing

Open Postman, click **Import**, and load the [postman/collection.json](file:///d:/Assignment/GithubProfileAnalyzer/postman/collection.json) file. The requests are pre-configured to point to `{{base_url}}` (defaults to `http://localhost:5000`).

---

## 👨‍💻 Author

**Naina Varshney**
* **GitHub**: [https://github.com/naina766](https://github.com/naina766)

---

## 📄 License

This project is licensed under the MIT License.
