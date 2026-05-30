const githubService = require('../services/github.service');
const Profile = require('../models/profile.model');

/**
 * POST /api/profiles/analyze/:username
 * Fetches profile and stores calculated analytics insights
 */
async function analyzeProfile(req, res, next) {
  const { username } = req.params;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'GitHub username is required.'
    });
  }

  try {
    console.log(`[Controller] Starting profile analysis for: ${username}`);
    
    // 1. Fetch raw details and calculate insights
    const { profileData, insights } = await githubService.performAnalysis(username);
    
    // 2. Persist to MySQL database (upsert)
    await Profile.upsert(profileData, insights);
    
    // 3. Return payload
    return res.status(200).json({
      success: true,
      message: 'GitHub profile successfully analyzed and stored.',
      data: {
        username: profileData.username,
        name: profileData.name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        public_repos: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
        total_stars: insights.total_stars,
        total_forks: insights.total_forks,
        top_language: insights.top_language,
        top_repo: insights.top_repo,
        follower_following_ratio: insights.follower_following_ratio,
        average_stars_per_repo: insights.average_stars_per_repo,
        repo_activity_score: insights.repo_activity_score,
        account_age_years: insights.account_age_years,
        organizations_count: profileData.organizations_count,
        profile_url: profileData.profile_url,
        account_created_at: profileData.account_created_at,
        top_5_repositories: insights.top_5_repositories
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/profiles
 * Returns paginated, sorted, and filtered analyzed profiles
 */
async function getProfiles(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'analyzed_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    // Whitelist valid columns for sorting to avoid SQL injection
    const allowedSortFields = [
      'username', 'name', 'public_repos', 'followers', 'following', 
      'total_stars', 'total_forks', 'repo_activity_score', 'analyzed_at'
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'analyzed_at';

    const { total, profiles } = await Profile.findAll({
      page,
      limit,
      search,
      sortBy: sortField,
      order
    });

    return res.status(200).json({
      success: true,
      count: profiles.length,
      total,
      page,
      limit,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/profiles/:username
 * Returns stored profile analysis results
 */
async function getProfile(req, res, next) {
  const { username } = req.params;

  try {
    const cachedProfile = await Profile.findByUsername(username);
    
    if (!cachedProfile) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' has not been analyzed yet. Use POST /api/profiles/analyze/${username} to fetch it.`
      });
    }

    // Because top_5_repositories is computed from repos and we don't save all repos in the DB,
    // we can either return cached DB values, or fetch from GitHub (with cache hit support).
    // Let's do a cache-only DB return, but if they want top repos, we can fetch repos from githubService 
    // which has a cache standard! That is highly efficient and guarantees they get top repos without database clutter.
    let top5Repos = [];
    try {
      const repos = await githubService.fetchRepos(username);
      top5Repos = [...repos]
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, 5)
        .map(repo => ({
          name: repo.name,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language || 'Unknown',
          description: repo.description || null,
          url: repo.html_url
        }));
    } catch (e) {
      console.warn(`Could not load top repositories from GitHub for single view: ${e.message}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...cachedProfile,
        top_5_repositories: top5Repos
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/profiles/refresh/:username
 * Re-fetches latest GitHub data, bypassing/evicting existing cache
 */
async function refreshProfile(req, res, next) {
  const { username } = req.params;

  try {
    console.log(`[Controller] Refreshing analysis for user: ${username}`);
    
    // 1. Evict node-cache entries
    githubService.clearCache(username);
    
    // 2. Fetch fresh analytics
    const { profileData, insights } = await githubService.performAnalysis(username);
    
    // 3. Upsert MySQL record
    await Profile.upsert(profileData, insights);
    
    return res.status(200).json({
      success: true,
      message: 'GitHub profile statistics successfully refreshed.',
      data: {
        username: profileData.username,
        name: profileData.name,
        total_stars: insights.total_stars,
        total_forks: insights.total_forks,
        top_language: insights.top_language,
        repo_activity_score: insights.repo_activity_score,
        top_5_repositories: insights.top_5_repositories
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/profiles/:username
 * Removes profile analysis from database and cache
 */
async function deleteProfile(req, res, next) {
  const { username } = req.params;

  try {
    const deleted = await Profile.deleteByUsername(username);
    githubService.clearCache(username);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' was not found in the database.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Profile '${username}' deleted successfully from database.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analytics
 * Compiles aggregated database analytics
 */
async function getAnalytics(req, res, next) {
  try {
    const analytics = await Profile.getAnalytics();
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeProfile,
  getProfiles,
  getProfile,
  refreshProfile,
  deleteProfile,
  getAnalytics
};
