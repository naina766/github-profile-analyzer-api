# GitScope — GitHub Developer Intelligence & Cache Registry

GitScope is a production-grade backend service built using Node.js, Express.js, and MySQL. It retrieves profile data and repository statistics from the GitHub public API, aggregates advanced developer metrics, stores insights in a MySQL database, and serves an interactive dark glassmorphic client dashboard.

This implementation follows the Clean Architecture / MVC blueprint with a service-repository layer, security controls, Swagger API documentation, local caching, and request rate-limiting.

---

## 📁 Overhauled Project Structure

```text
├── src/
│   ├── config/
│   │   └── db.js                 # MySQL Pool & automated table migrator
│   ├── controllers/
│   │   └── profile.controller.js # Maps HTTP queries to database models/services
│   ├── middlewares/
│   │   ├── error.middleware.js   # Centralized JSON error catcher
│   │   └── rateLimiter.js        # IP rate limiter (express-rate-limit)
│   ├── models/
│   │   └── profile.model.js      # Raw SQL queries wrapper (repository layer)
│   ├── routes/
│   │   └── profile.routes.js     # API endpoints declarations
│   ├── services/
│   │   └── github.service.js     # Axios queries with node-cache & concurrent analysis
│   ├── utils/
│   │   └── calculateInsights.js  # Analytics computations logic
│   ├── app.js                    # Helmet, CORS, and Swagger UI configurations
│   └── server.js                 # App server launcher (default port: 5000)
├── sql/
│   └── schema.sql                # Database structure table definition
├── postman/
│   └── collection.json           # Importable API query collections
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

## 💎 Advanced Analytics Insights Computed

Instead of basic data, GitScope calculates key developer metrics:
* **Account Age**: Calculated dynamically based on the account creation date.
* **Follower Ratio**: Follower-to-following index (handles division by zero).
* **Average Stars**: Total stars divided by public repository count.
* **Top Repository**: The user's most starred repository name.
* **Repository Activity Score**: Capped at 100 points, calculated using weighted parameters (stars volume, forks volume, repository scale, and code push recency within the last 30/90/365 days).
* **Top 5 Starred Repositories**: Sub-array listing name, description, primary language, stars, and forks counts.

---

## 🚀 Setup & Installation Instructions

### 1. Prerequisites
Make sure you have installed:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (optional, for easy local database setup)
* Or a local installation of [MySQL Server](https://dev.mysql.com/downloads/installer/)

### 2. Install Packages
Clone the repository and run:
```bash
npm install
```

### 3. Spin Up Local MySQL (Using Docker)
If you have Docker installed, you can start MySQL inside a background container with one command:
```bash
docker-compose up -d
```
*This starts a MySQL instance running on port `3306` with root credentials (`root`/`root_password`).*

### 4. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Open `.env` and fill in details (port defaults to 5000):
```ini
PORT=5000
NODE_ENV=development

# MySQL Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root_password
DB_NAME=github_analyzer

# Highly Recommended: personal access token to prevent API limits blocks
# Create at: https://github.com/settings/tokens
GITHUB_TOKEN=
```

---

## 🖥️ Running the Application

### Development Mode (with hot-reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```
*On boot, the database `github_analyzer` and table `github_profiles` are checked and migrated automatically.*

Open **[http://localhost:5000](http://localhost:5000)** in your browser to load the dashboard.

---

## 🔌 API Endpoints Specifications

### 1. Interactive Swagger Documentation
Open **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)** in your browser to view the OpenAPI UI and execute request queries directly from the screen.

### 2. Analyze Profile
* **URL**: `/api/profiles/analyze/:username`
* **Method**: `POST`
* **Description**: Queries GitHub API, computes metrics, and caches insights in MySQL.
* **Response**: `200 OK` returns analyzed profile insights.

### 3. Get Analyzed List
* **URL**: `/api/profiles`
* **Method**: `GET`
* **Parameters**: `page`, `limit`, `search` (matches username, name, bio), `sortBy`, `order`.
* **Response**: `200 OK` returns paginated registry array.

### 4. Get Registry Analytics
* **URL**: `/api/profiles/analytics`
* **Method**: `GET`
* **Description**: Aggregated database statistics (total users count, average followers, most common language, top follower developer).

### 5. Get Single Cache Profile
* **URL**: `/api/profiles/:username`
* **Method**: `GET`

### 6. Refresh Stored Profile
* **URL**: `/api/profiles/refresh/:username`
* **Method**: `PUT`
* **Description**: Evicts local node-cache keys, calls the live API, and updates the database record.

### 7. Delete Cache Profile
* **URL**: `/api/profiles/:username`
* **Method**: `DELETE`

### 8. Health Check
* **URL**: `/health`
* **Method**: `GET`

---

## 📬 Testing with Postman

Import [postman/collection.json](file:///d:/Assignment/GithubProfileAnalyzer/postman/collection.json) directly into Postman to load pre-configured endpoints and check variables pointing to `http://localhost:5000`.
