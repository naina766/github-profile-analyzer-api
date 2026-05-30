/**
 * GitHub Profile Insights Calculator
 */

/**
 * Calculates developer metrics and insights from GitHub profile and repository list
 * @param {Object} profile - GitHub user profile object
 * @param {Array} repos - List of public repositories
 * @returns {Object} Calculated insights
 */
function calculateInsights(profile, repos = []) {
  const publicRepos = profile.public_repos || 0;
  const followers = profile.followers || 0;
  const following = profile.following || 0;
  
  // 1. Basic sums
  let totalStars = 0;
  let totalForks = 0;
  let topRepo = null;
  let maxStars = -1;
  
  const languageCounts = {};
  
  repos.forEach(repo => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    
    // Track top repo (by stars)
    if (repo.stargazers_count > maxStars) {
      maxStars = repo.stargazers_count;
      topRepo = repo.name;
    }
    
    // Count primary languages
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  // 2. Identify top language
  let topLanguage = null;
  let maxLangCount = 0;
  Object.keys(languageCounts).forEach(lang => {
    if (languageCounts[lang] > maxLangCount) {
      maxLangCount = languageCounts[lang];
      topLanguage = lang;
    }
  });

  // 3. Compute Follower/Following ratio
  let followerFollowingRatio = 0.00;
  if (following > 0) {
    followerFollowingRatio = parseFloat((followers / following).toFixed(2));
  } else if (followers > 0) {
    followerFollowingRatio = parseFloat(followers.toFixed(2)); // Avoid division by zero
  }

  // 4. Compute average stars per repo
  let averageStarsPerRepo = 0.00;
  if (repos.length > 0) {
    averageStarsPerRepo = parseFloat((totalStars / repos.length).toFixed(2));
  }

  // 5. Compute account age
  let accountAgeYears = 0;
  if (profile.created_at) {
    const createdDate = new Date(profile.created_at);
    const currentDate = new Date();
    const diffMs = currentDate - createdDate;
    // Calculate fractional year or rounded integer
    accountAgeYears = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
  }

  // 6. Compute sophisticated repo activity score (capped at 100)
  let repoActivityScore = 0.00;
  if (repos.length > 0) {
    let recencyPoints = 0;
    const now = new Date();
    
    repos.forEach(repo => {
      if (repo.pushed_at) {
        const pushedDate = new Date(repo.pushed_at);
        const diffDays = (now - pushedDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 30) recencyPoints += 10;       // Pushed in last 30 days
        else if (diffDays <= 90) recencyPoints += 5;   // Pushed in last 90 days
        else if (diffDays <= 365) recencyPoints += 2;  // Pushed in last year
      }
    });

    // Score is composed of weighted variables:
    // - Recency of code pushes: Max 30 pts
    // - Stars volume: Max 30 pts
    // - Forks volume: Max 30 pts
    // - Repo count scale: Max 10 pts
    const pushWeight = Math.min(recencyPoints, 30);
    const starWeight = Math.min(totalStars * 0.5, 30);
    const forkWeight = Math.min(totalForks * 0.8, 30);
    const scaleWeight = Math.min(repos.length * 1.5, 10);
    
    repoActivityScore = parseFloat((pushWeight + starWeight + forkWeight + scaleWeight).toFixed(2));
  }

  // 7. Get top 5 repos for returning in detail payload (ordered by stars desc)
  const top5Repos = [...repos]
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

  return {
    total_stars: totalStars,
    total_forks: totalForks,
    top_language: topLanguage,
    top_repo: topRepo,
    follower_following_ratio: followerFollowingRatio,
    average_stars_per_repo: averageStarsPerRepo,
    repo_activity_score: repoActivityScore,
    account_age_years: accountAgeYears,
    top_5_repositories: top5Repos
  };
}

module.exports = calculateInsights;
