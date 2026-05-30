const db = require('../config/db');

/**
 * Inserts or updates a developer profile analysis details in the DB
 * @param {Object} profileData - Profile base details
 * @param {Object} insights - Advanced computed statistics
 */
async function upsert(profileData, insights) {
  const sql = `
    INSERT INTO github_profiles (
      github_id, username, name, bio, avatar_url,
      public_repos, followers, following,
      total_stars, total_forks, top_language, top_repo,
      follower_following_ratio, average_stars_per_repo,
      repo_activity_score, account_age_years, organizations_count,
      profile_url, account_created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      bio = VALUES(bio),
      avatar_url = VALUES(avatar_url),
      public_repos = VALUES(public_repos),
      followers = VALUES(followers),
      following = VALUES(following),
      total_stars = VALUES(total_stars),
      total_forks = VALUES(total_forks),
      top_language = VALUES(top_language),
      top_repo = VALUES(top_repo),
      follower_following_ratio = VALUES(follower_following_ratio),
      average_stars_per_repo = VALUES(average_stars_per_repo),
      repo_activity_score = VALUES(repo_activity_score),
      account_age_years = VALUES(account_age_years),
      organizations_count = VALUES(organizations_count),
      profile_url = VALUES(profile_url),
      account_created_at = VALUES(account_created_at),
      analyzed_at = CURRENT_TIMESTAMP
  `;

  const values = [
    profileData.github_id,
    profileData.username,
    profileData.name,
    profileData.bio,
    profileData.avatar_url,
    profileData.public_repos,
    profileData.followers,
    profileData.following,
    insights.total_stars,
    insights.total_forks,
    insights.top_language,
    insights.top_repo,
    insights.follower_following_ratio,
    insights.average_stars_per_repo,
    insights.repo_activity_score,
    insights.account_age_years,
    profileData.organizations_count,
    profileData.profile_url,
    profileData.account_created_at
  ];

  await db.query(sql, values);
}

/**
 * Retrieve a stored profile by its username
 * @param {string} username - User account name
 * @returns {Object|null} User statistics row
 */
async function findByUsername(username) {
  const sql = 'SELECT * FROM github_profiles WHERE username = ?';
  const [rows] = await db.query(sql, [username]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Retrieve a list of stored profiles with pagination, search, and sorting
 */
async function findAll({ page = 1, limit = 10, search = '', sortBy = 'analyzed_at', order = 'DESC' }) {
  const offset = (page - 1) * limit;
  let countSql = 'SELECT COUNT(*) as total FROM github_profiles';
  let dataSql = 'SELECT * FROM github_profiles';
  const params = [];

  if (search.trim() !== '') {
    const filter = `%${search}%`;
    countSql += ' WHERE username LIKE ? OR name LIKE ? OR bio LIKE ?';
    dataSql += ' WHERE username LIKE ? OR name LIKE ? OR bio LIKE ?';
    params.push(filter, filter, filter);
  }

  // 1. Get total counts
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0].total;

  // 2. Fetch sorted slice
  dataSql += ` ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [profiles] = await db.query(dataSql, params);

  return {
    total,
    profiles
  };
}

/**
 * Delete a profile from cache by username
 * @param {string} username - User account name
 * @returns {boolean} Whether it was deleted
 */
async function deleteByUsername(username) {
  const sql = 'DELETE FROM github_profiles WHERE username = ?';
  const [result] = await db.query(sql, [username]);
  return result.affectedRows > 0;
}

/**
 * Compiles global aggregated statistics
 */
async function getAnalytics() {
  const countSql = 'SELECT COUNT(*) as totalUsers FROM github_profiles';
  const avgFollowersSql = 'SELECT ROUND(AVG(followers), 2) as avgFollowers FROM github_profiles';
  
  const topLanguageSql = `
    SELECT top_language, COUNT(*) as count 
    FROM github_profiles 
    WHERE top_language IS NOT NULL 
    GROUP BY top_language 
    ORDER BY count DESC 
    LIMIT 1
  `;
  
  const topFollowedSql = `
    SELECT username, name, followers, avatar_url 
    FROM github_profiles 
    ORDER BY followers DESC 
    LIMIT 1
  `;

  // Fetch in parallel for optimized speed
  const [
    [countRows],
    [avgRows],
    [langRows],
    [followRows]
  ] = await Promise.all([
    db.query(countSql),
    db.query(avgFollowersSql),
    db.query(topLanguageSql),
    db.query(topFollowedSql)
  ]);

  return {
    total_analyzed_users: countRows[0].totalUsers || 0,
    average_followers: parseFloat(avgRows[0].avgFollowers) || 0.00,
    most_common_language: langRows.length > 0 ? langRows[0].top_language : 'None',
    most_followed_developer: followRows.length > 0 ? {
      username: followRows[0].username,
      name: followRows[0].name,
      followers: followRows[0].followers,
      avatar_url: followRows[0].avatar_url
    } : null
  };
}

module.exports = {
  upsert,
  findByUsername,
  findAll,
  deleteByUsername,
  getAnalytics
};
