const axios = require('axios');
const NodeCache = require('node-cache');
const calculateInsights = require('../utils/calculateInsights');

const GITHUB_API_URL = 'https://api.github.com';

// Cache profile queries for 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

/**
 * Configure request header properties
 */
function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'GitHub-Profile-Analyzer-API'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  
  return headers;
}

/**
 * Fetch base user profile info (cached)
 */
async function fetchProfile(username) {
  const cacheKey = `profile_${username.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log(`[Cache Hit] Profile data for: ${username}`);
    return cachedData;
  }
  
  console.log(`[Cache Miss] Fetching profile from GitHub API for: ${username}`);
  try {
    const url = `${GITHUB_API_URL}/users/${encodeURIComponent(username)}`;
    const response = await axios.get(url, { headers: getHeaders() });
    
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    handleAxiosError(error, username);
  }
}

/**
 * Fetch user repositories (cached, up to 300 repos)
 */
async function fetchRepos(username) {
  const cacheKey = `repos_${username.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log(`[Cache Hit] Repos list for: ${username}`);
    return cachedData;
  }
  
  console.log(`[Cache Miss] Fetching repos from GitHub API for: ${username}`);
  try {
    let repos = [];
    const perPage = 100;
    
    for (let page = 1; page <= 3; page++) {
      const url = `${GITHUB_API_URL}/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}`;
      const response = await axios.get(url, { headers: getHeaders() });
      const pageRepos = response.data;
      
      if (!pageRepos || pageRepos.length === 0) break;
      repos = repos.concat(pageRepos);
      
      if (pageRepos.length < perPage) break;
    }
    
    cache.set(cacheKey, repos);
    return repos;
  } catch (error) {
    handleAxiosError(error, username);
  }
}

/**
 * Fetch user organizations memberships list (fail-safe)
 */
async function fetchOrgs(username) {
  const cacheKey = `orgs_${username.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log(`[Cache Hit] Organizations for: ${username}`);
    return cachedData;
  }
  
  console.log(`[Cache Miss] Fetching organizations for: ${username}`);
  try {
    const url = `${GITHUB_API_URL}/users/${encodeURIComponent(username)}/orgs`;
    const response = await axios.get(url, { headers: getHeaders() });
    
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.warn(`[Graceful Fallback] Failed to fetch organizations for ${username}: ${error.message}`);
    return [];
  }
}

/**
 * Orchestrates raw profile queries and invokes insights utility computations
 * @param {string} username - GitHub username to analyze
 * @returns {Object} Comprehensive profile metadata and calculated insights
 */
async function performAnalysis(username) {
  // Query GitHub resources concurrently for high efficiency
  const [profile, repos, orgs] = await Promise.all([
    fetchProfile(username),
    fetchRepos(username),
    fetchOrgs(username)
  ]);
  
  // Run statistical aggregation and metrics calculator
  const insights = calculateInsights(profile, repos);
  
  // Compile full unified layout matching DB table columns
  return {
    profileData: {
      github_id: profile.id,
      username: profile.login,
      name: profile.name || null,
      bio: profile.bio || null,
      avatar_url: profile.avatar_url || null,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      account_created_at: profile.created_at ? new Date(profile.created_at) : null,
      profile_url: profile.html_url || null,
      organizations_count: orgs ? orgs.length : 0
    },
    insights
  };
}

/**
 * Evict keys from node-cache to force refresh
 */
function clearCache(username) {
  const keyUser = username.toLowerCase();
  cache.del(`profile_${keyUser}`);
  cache.del(`repos_${keyUser}`);
  cache.del(`orgs_${keyUser}`);
  console.log(`[Cache Evict] Cleared keys for user: ${username}`);
}

/**
 * Common Axios Error handling mapping
 */
function handleAxiosError(error, username) {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data.message || error.message;
    
    if (status === 404) {
      const err = new Error(`GitHub user '${username}' not found.`);
      err.status = 404;
      throw err;
    }
    
    const err = new Error(message);
    err.status = status;
    throw err;
  }
  
  const err = new Error(`Failed to communicate with GitHub API: ${error.message}`);
  err.status = 502;
  throw err;
}

module.exports = {
  fetchProfile,
  fetchRepos,
  fetchOrgs,
  performAnalysis,
  clearCache,
  cache
};
