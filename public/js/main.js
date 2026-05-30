// State Management
let currentPage = 1;
const itemsPerPage = 8;
let dbOnline = true;
let historySearchQuery = '';

// Language Color Mapping
const languageColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Ruby: '#701516',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Angular: '#dd0031',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Scala: '#c22d40',
  Objective: '#438eff',
  R: '#198ce7'
};

function getLanguageColor(lang) {
  return languageColors[lang] || '#8b949e';
}

// DOM Elements
const searchForm = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const searchBtn = document.getElementById('search-btn');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('analysis-results');
const dbStatusBanner = document.getElementById('db-status-banner');
const dbStatusText = document.getElementById('db-status-text');

// Profile DOM Elements
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userUsername = document.getElementById('user-username');
const userGithubLink = document.getElementById('user-github-link');
const userBio = document.getElementById('user-bio');
const userLocation = document.getElementById('user-location');
const userCompany = document.getElementById('user-company');
const userBlog = document.getElementById('user-blog');
const userTwitter = document.getElementById('user-twitter');
const userJoined = document.getElementById('user-joined');

// Advanced Profile Analytics DOM Elements
const userAge = document.getElementById('user-age');
const userRatio = document.getElementById('user-ratio');
const userOrgs = document.getElementById('user-orgs');
const userActivity = document.getElementById('user-activity');

// Stat Cards DOM Elements
const statRepos = document.getElementById('stat-repos');
const statFollowers = document.getElementById('stat-followers');
const statFollowing = document.getElementById('stat-following');
const statStars = document.getElementById('stat-stars');
const statForks = document.getElementById('stat-forks');
const statAvgStars = document.getElementById('stat-avg-stars');

const languagesContainer = document.getElementById('languages-container');
const topReposContainer = document.getElementById('top-repos-container');

// Global DB Registry Analytics DOM Elements
const globalAnalyticsSection = document.getElementById('global-analytics-section');
const globalTotalUsers = document.getElementById('global-total-users');
const globalAvgFollowers = document.getElementById('global-avg-followers');
const globalCommonLang = document.getElementById('global-common-lang');
const globalStarAvatar = document.getElementById('global-star-avatar');
const globalStarName = document.getElementById('global-star-name');

// History DOM Elements
const historyGrid = document.getElementById('history-grid');
const historySearchInput = document.getElementById('history-search-input');
const refreshHistoryBtn = document.getElementById('refresh-history-btn');
const paginationControls = document.getElementById('pagination-controls');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageIndicator = document.getElementById('page-indicator');

// Setup Applications Hooks
document.addEventListener('DOMContentLoaded', () => {
  // Setup icons
  lucide.createIcons();
  
  // Health checks
  checkDatabaseStatus();
  
  // Handlers
  searchForm.addEventListener('submit', handleSearchSubmit);
  refreshHistoryBtn.addEventListener('click', () => {
    fetchHistory(currentPage);
    fetchGlobalRegistryStats();
  });
  historySearchInput.addEventListener('input', debounce(handleHistorySearch, 400));
  
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchHistory(currentPage);
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    fetchHistory(currentPage);
  });
});

/**
 * Perform database connection checks
 */
async function checkDatabaseStatus() {
  try {
    const response = await fetch('/health');
    const status = await response.json();
    
    if (status.database !== 'CONNECTED') {
      setDbOffline(status.error || 'MySQL unreachable');
    } else {
      setDbOnline();
      fetchHistory(1);
      fetchGlobalRegistryStats();
    }
  } catch (err) {
    setDbOffline('Express backend is unreachable');
  }
}

function setDbOffline(errorMsg) {
  dbOnline = false;
  dbStatusBanner.classList.remove('hidden');
  dbStatusText.innerText = `Database Connection Failed: ${errorMsg}. Local caching & global analytics are disabled.`;
  document.querySelector('.history-section').classList.add('hidden');
  globalAnalyticsSection.classList.add('hidden');
}

function setDbOnline() {
  dbOnline = true;
  dbStatusBanner.classList.add('hidden');
  document.querySelector('.history-section').classList.remove('hidden');
  globalAnalyticsSection.classList.remove('hidden');
}

/**
 * Query Global Database Registries Stats
 */
async function fetchGlobalRegistryStats() {
  if (!dbOnline) return;
  
  try {
    const response = await fetch('/api/profiles/analytics');
    const result = await response.json();
    
    if (result.success && result.data) {
      const stats = result.data;
      globalTotalUsers.innerText = stats.total_analyzed_users;
      globalAvgFollowers.innerText = formatNumber(stats.average_followers);
      globalCommonLang.innerText = stats.most_common_language || 'N/A';
      
      if (stats.most_followed_developer) {
        globalStarAvatar.src = stats.most_followed_developer.avatar_url;
        globalStarAvatar.classList.remove('hidden');
        globalStarName.innerText = `${stats.most_followed_developer.name || stats.most_followed_developer.username} (${formatNumber(stats.most_followed_developer.followers)} followers)`;
      } else {
        globalStarAvatar.classList.add('hidden');
        globalStarName.innerText = 'N/A';
      }
    }
  } catch (err) {
    console.error('Failed to query registry analytics:', err);
  }
}

/**
 * Handle new profile analyze submissions
 */
async function handleSearchSubmit(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  setLoadingState(true);
  
  try {
    const response = await fetch(`/api/profiles/analyze/${encodeURIComponent(username)}`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Analysis operation failed.');
    }
    
    renderProfileAnalysis(result.data);
    showToast(`Successfully analyzed and cached @${result.data.username}!`, 'success');
    
    if (dbOnline) {
      currentPage = 1;
      fetchHistory(1);
      fetchGlobalRegistryStats();
    }
    
  } catch (err) {
    console.error('Analysis error:', err);
    showToast(err.message, 'error');
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  if (isLoading) {
    loader.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    searchBtn.disabled = true;
    usernameInput.disabled = true;
  } else {
    loader.classList.add('hidden');
    searchBtn.disabled = false;
    usernameInput.disabled = false;
  }
}

/**
 * Populate UI components with analytics details
 */
function renderProfileAnalysis(data) {
  resultsSection.classList.remove('hidden');
  
  // Set main metadata
  userAvatar.src = data.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
  userName.innerText = data.name || data.username;
  userUsername.innerText = data.username;
  userGithubLink.href = data.profile_url || `https://github.com/${data.username}`;
  userBio.innerText = data.bio || 'This user has no bio description.';
  
  // Detail grid rows
  toggleDetail('location', data.location);
  toggleDetail('company', data.company);
  toggleDetail('blog', data.blog, true);
  toggleDetail('twitter', data.twitter_username ? `@${data.twitter_username}` : null, false, `https://twitter.com/${data.twitter_username}`);
  
  // Created date
  if (data.account_created_at || data.github_created_at) {
    const date = new Date(data.account_created_at || data.github_created_at);
    userJoined.innerText = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } else {
    userJoined.innerText = 'Unknown';
  }
  
  // Advanced Insights badges
  userAge.innerText = data.account_age_years || 0;
  userRatio.innerText = (data.follower_following_ratio !== undefined) ? data.follower_following_ratio.toFixed(2) : '0.00';
  userOrgs.innerText = data.organizations_count || 0;
  userActivity.innerText = (data.repo_activity_score !== undefined) ? data.repo_activity_score.toFixed(1) : '0.0';
  
  // Statistics cards
  statRepos.innerText = formatNumber(data.public_repos);
  statFollowers.innerText = formatNumber(data.followers);
  statFollowing.innerText = formatNumber(data.following);
  statStars.innerText = formatNumber(data.total_stars);
  statForks.innerText = formatNumber(data.total_forks);
  statAvgStars.innerText = (data.average_stars_per_repo !== undefined) ? data.average_stars_per_repo.toFixed(1) : '0.0';

  // Rendering languages list
  renderLanguagesBreakdown(data);

  // Rendering top 5 repositories
  renderTopRepositories(data.top_5_repositories);
  
  // Reparse icons
  lucide.createIcons();
  
  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLanguagesBreakdown(data) {
  languagesContainer.innerHTML = '';
  
  // Re-calculate languages from repositories array since the new database design does not hold percentages array
  // We can construct it dynamically based on the top languages!
  if (data.top_5_repositories && data.top_5_repositories.length > 0) {
    // Collect language counts
    const langCounts = {};
    let totalReposWithLang = 0;
    
    // We can also utilize the top_language column
    const mainLang = data.top_language;
    
    // Check languages in top repos
    data.top_5_repositories.forEach(repo => {
      if (repo.language && repo.language !== 'Unknown') {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        totalReposWithLang++;
      }
    });

    // Make sure we represent the top language if it's not in the list
    if (mainLang && mainLang !== 'None' && !langCounts[mainLang]) {
      langCounts[mainLang] = 1;
      totalReposWithLang++;
    }

    const languages = Object.keys(langCounts).map(lang => {
      const count = langCounts[lang];
      const percentage = totalReposWithLang > 0 ? parseFloat(((count / totalReposWithLang) * 100).toFixed(1)) : 0;
      return { language: lang, count, percentage };
    }).sort((a, b) => b.count - a.count);

    if (languages.length > 0) {
      languages.forEach(lang => {
        const color = getLanguageColor(lang.language);
        const row = document.createElement('div');
        row.className = 'language-row';
        row.innerHTML = `
          <div class="lang-info">
            <div class="lang-name-tag">
              <span class="lang-dot" style="background-color: ${color}"></span>
              <span class="lang-name">${lang.language}</span>
            </div>
            <span class="lang-stats">${lang.percentage}%</span>
          </div>
          <div class="lang-bar-bg">
            <div class="lang-bar-fill" style="background-color: ${color}; width: 0%"></div>
          </div>
        `;
        languagesContainer.appendChild(row);
        
        setTimeout(() => {
          const fill = row.querySelector('.lang-bar-fill');
          if (fill) fill.style.width = `${lang.percentage}%`;
        }, 50);
      });
    } else {
      languagesContainer.innerHTML = '<p class="no-languages">No language distributions available.</p>';
    }
  } else {
    languagesContainer.innerHTML = '<p class="no-languages">No language distributions available.</p>';
  }
}

function renderTopRepositories(repos = []) {
  topReposContainer.innerHTML = '';
  
  if (!repos || repos.length === 0) {
    topReposContainer.innerHTML = '<p class="no-repos">No repository insights available.</p>';
    return;
  }
  
  repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-item-card';
    card.innerHTML = `
      <div class="repo-item-header">
        <a class="repo-item-title" href="${repo.url}" target="_blank">
          <i data-lucide="book-open" class="inline-icon text-blue"></i>
          ${repo.name}
        </a>
        <div class="repo-item-stats">
          <span><i data-lucide="star"></i> ${formatNumber(repo.stars)}</span>
          <span><i data-lucide="git-fork"></i> ${formatNumber(repo.forks)}</span>
        </div>
      </div>
      <p class="repo-item-desc">${repo.description || 'No description provided.'}</p>
      <div class="history-meta" style="margin-top: 8px;">
        <span class="lang-name-tag">
          <span class="lang-dot" style="background-color: ${getLanguageColor(repo.language)}"></span>
          ${repo.language}
        </span>
      </div>
    `;
    topReposContainer.appendChild(card);
  });
}

function toggleDetail(key, value, isLink = false, linkUrl = null) {
  const container = document.getElementById(`detail-${key}-container`);
  if (!container) return;
  
  if (value) {
    container.classList.remove('hidden');
    const spanOrAnchor = container.querySelector('span') || container.querySelector('a');
    if (spanOrAnchor) {
      if (isLink) {
        spanOrAnchor.innerText = value;
        spanOrAnchor.href = linkUrl || (value.startsWith('http') ? value : `https://${value}`);
      } else if (linkUrl) {
        spanOrAnchor.innerText = value;
        spanOrAnchor.href = linkUrl;
      } else {
        spanOrAnchor.innerText = value;
      }
    }
  } else {
    container.classList.add('hidden');
  }
}

/**
 * Fetch cached registry profiles list
 */
async function fetchHistory(page = 1) {
  if (!dbOnline) return;
  
  try {
    const url = `/api/profiles?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(historySearchQuery)}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message);
    }
    
    renderHistory(result.data);
    updatePagination(result.total, result.page, result.limit);
  } catch (err) {
    console.error('History fetch error:', err);
    showToast('Failed to load profiles cache list.', 'error');
  }
}

function renderHistory(profiles) {
  historyGrid.innerHTML = '';
  
  if (!profiles || profiles.length === 0) {
    historyGrid.innerHTML = `
      <div class="history-empty">
        <i data-lucide="folder-search"></i>
        <p>${historySearchQuery ? 'No matching cached profiles found.' : 'No profiles cached yet. Enter a username above to start.'}</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  profiles.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'glass-panel history-card';
    card.innerHTML = `
      <div class="history-card-left">
        <img class="history-avatar" src="${profile.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}" alt="avatar">
        <div class="history-info">
          <span class="history-name">${profile.name || profile.username}</span>
          <span class="history-username">@${profile.username}</span>
          <div class="history-meta">
            <span><i data-lucide="star"></i> ${profile.total_stars}</span>
            <span><i data-lucide="zap"></i> Act: ${profile.repo_activity_score ? profile.repo_activity_score.toFixed(0) : 0}</span>
            <span><i data-lucide="code-2"></i> ${profile.top_language || 'N/A'}</span>
          </div>
        </div>
      </div>
      <div class="history-actions">
        <button class="icon-btn btn-refresh" title="Force Refresh from GitHub" style="color: var(--accent); margin-right: 4px;">
          <i data-lucide="rotate-cw"></i>
        </button>
        <button class="btn-delete" title="Delete from DB">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;
    
    // Core click bindings
    card.addEventListener('click', (e) => {
      // 1. Delete handler
      if (e.target.closest('.btn-delete')) {
        handleDeleteProfile(profile.username, card);
        return;
      }
      // 2. Refresh handler
      if (e.target.closest('.btn-refresh')) {
        handleRefreshProfile(profile.username);
        return;
      }
      // 3. Details load
      loadCachedProfile(profile.username);
    });
    
    historyGrid.appendChild(card);
  });
  
  lucide.createIcons();
}

/**
 * Fetch cached details of a profile
 */
async function loadCachedProfile(username) {
  setLoadingState(true);
  try {
    const response = await fetch(`/api/profiles/${encodeURIComponent(username)}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message);
    }
    
    renderProfileAnalysis(result.data);
    showToast(`Loaded @${username} analytics from MySQL cache.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoadingState(false);
  }
}

/**
 * PUT refresh cache trigger
 */
async function handleRefreshProfile(username) {
  setLoadingState(true);
  try {
    const response = await fetch(`/api/profiles/refresh/${encodeURIComponent(username)}`, {
      method: 'PUT'
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message);
    }
    
    // Re-fetch details to draw the full UI
    const detailResponse = await fetch(`/api/profiles/${encodeURIComponent(username)}`);
    const detailResult = await detailResponse.json();
    
    renderProfileAnalysis(detailResult.data);
    showToast(`Bypassed cache and re-fetched statistics for @${username}!`, 'success');
    
    fetchHistory(currentPage);
    fetchGlobalRegistryStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoadingState(false);
  }
}

/**
 * DELETE profile database row
 */
async function handleDeleteProfile(username, cardElement) {
  if (!confirm(`Are you sure you want to delete @${username} metrics from the registry database?`)) return;
  
  try {
    const response = await fetch(`/api/profiles/${encodeURIComponent(username)}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message);
    }
    
    showToast(`Deleted @${username} from database cache registry.`, 'success');
    
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.9)';
    setTimeout(() => {
      fetchHistory(currentPage);
      fetchGlobalRegistryStats();
    }, 300);
    
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleHistorySearch(e) {
  historySearchQuery = e.target.value.trim();
  currentPage = 1;
  fetchHistory(1);
}

/**
 * Pagination triggers
 */
function updatePagination(totalItems, page, limit) {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  currentPage = page;
  
  if (totalItems <= limit) {
    paginationControls.classList.add('hidden');
    return;
  }
  
  paginationControls.classList.remove('hidden');
  pageIndicator.innerText = `Page ${page} of ${totalPages}`;
  
  prevPageBtn.disabled = page === 1;
  nextPageBtn.disabled = page === totalPages;
}

// Utility Helpers
function formatNumber(num) {
  if (num === null || num === undefined) return 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  // Round standard decimal stats nicely
  if (num % 1 !== 0) return parseFloat(num.toFixed(1));
  return num;
}

function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * UI Toast feedback cards creator
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'alert-triangle';
  
  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.style.animation = 'slideInLeft 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
