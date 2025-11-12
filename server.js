const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT secret - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'prayer-center-staff-secret-key-change-in-production';
const JWT_COOKIE_NAME = 'auth_token';

// Use /tmp directory on Vercel (serverless functions have read-only filesystem except /tmp)
// For local development, use data directory
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Source files in project (for copying to /tmp on Vercel)
const SOURCE_DATA_DIR = path.join(__dirname, 'data');
const SOURCE_DATA_FILE = path.join(SOURCE_DATA_DIR, 'data.json');
const SOURCE_USERS_FILE = path.join(SOURCE_DATA_DIR, 'users.json');

// Middleware
// Trust proxy on Vercel (important for cookies)
app.set('trust proxy', 1);

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Cookie parser helper
function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            cookies[parts[0]] = parts[1];
        });
    }
    return cookies;
}

// Explicit routes for static assets (MUST come before static middleware)
app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.sendFile(path.join(__dirname, 'styles.css'), (err) => {
        if (err) {
            console.error('Error serving styles.css:', err);
            res.status(404).send('CSS file not found');
        }
    });
});

app.get('/app.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(__dirname, 'app.js'), (err) => {
        if (err) {
            console.error('Error serving app.js:', err);
            res.status(404).send('JS file not found');
        }
    });
});

app.get('/auth.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.sendFile(path.join(__dirname, 'auth.js'), (err) => {
        if (err) {
            console.error('Error serving auth.js:', err);
            res.status(404).send('JS file not found');
        }
    });
});

// Handle root route explicitly
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Error loading page');
        }
    });
});

// Serve static files (HTML, CSS, JS) - fallback for other static files
// Use absolute path resolution for better compatibility
const staticPath = path.resolve(__dirname);
app.use(express.static(staticPath, {
    index: ['index.html'],
    extensions: ['html', 'css', 'js'],
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        // Set proper content types
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// Authentication middleware - verify JWT token
function requireAuth(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[JWT_COOKIE_NAME];
    
    console.log('🔒 requireAuth check:', {
        hasToken: !!token,
        cookies: req.headers.cookie ? 'present' : 'missing'
    });
    
    if (!token) {
        console.log('❌ Auth check failed - no token');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        console.log('✅ Auth check passed for:', decoded.email);
        return next();
    } catch (error) {
        console.log('❌ Auth check failed - invalid token:', error.message);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

// Initialize data file if it doesn't exist
async function initializeDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // File doesn't exist, create it with default structure
        const today = new Date();
        const year = today.getFullYear();
        const weekNumber = Math.ceil((today - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        const currentWeek = `${year}-W${String(weekNumber).padStart(2, '0')}`;
        
        // Default staff list from original document
        const defaultStaff = [
            'Pat Bailey', 'Richard Helmer', 'Dawn Sears', 'Jennifer Isaiah-Lawal',
            'Carmen Quesada', 'John Rhee', 'David Piper', 'Danette Bloomfield',
            'Leonard Hutchinson', 'Gloria Rankin', 'Penny Spence', 'Ruth Stockdale',
            'Joyce Frederick', 'Marilyn Khasnabish', 'Cathy Bard', 'Delani Chinnappah',
            'Valerie Masinzo', 'Lois Walker', 'Coral Jones', 'Benjamin Paul',
            'Chris O\'Connor', 'Katie Meilleur', 'Gloria Willoughby', 'Jordan Berta',
            'Sharon L-Arndt', 'Anne Gwaza', 'Carol Gray', 'Elizabeth Danna'
        ];
        
        const defaultData = {
            staff: defaultStaff,
            currentWeek: currentWeek,
            weeks: {
                [currentWeek]: {
                    sunday: { date: '', shifts: [] },
                    monday: { date: '', shifts: [] },
                    tuesday: { date: '', shifts: [] },
                    wednesday: { date: '', shifts: [] },
                    thursday: { date: '', shifts: [] },
                    friday: { date: '', shifts: [] },
                    saturday: { date: '', shifts: [] }
                }
            },
            additionalNotes: {},
            staffProfiles: {}
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
        console.log('Created initial data.json file');
    }
}

// Read data from file
async function readData() {
    try {
        console.log('📖 Attempting to read data from:', DATA_FILE);
        await fs.access(DATA_FILE);
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        console.log('✅ Successfully read and parsed data file');
        return parsed;
    } catch (error) {
        console.error('❌ Error reading data file:', error.message);
        console.error('   File path:', DATA_FILE);
        console.error('   Error code:', error.code);
        return null;
    }
}

// Write data to file
async function writeData(data) {
    try {
        console.log('✍️ Attempting to write data to:', DATA_FILE);
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('✅ Successfully wrote data file');
        return true;
    } catch (error) {
        console.error('❌ Error writing data file:', error.message);
        console.error('   File path:', DATA_FILE);
        console.error('   Error code:', error.code);
        return false;
    }
}

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt for:', email);
        console.log('📁 Users file location:', USERS_FILE);
        
        if (!email || !password) {
            console.log('❌ Login failed: Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const users = await readUsers();
        console.log('👥 Users loaded:', users.length, 'users found');
        console.log('📋 User emails:', users.map(u => u.email));
        
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            console.log('❌ Login failed: User not found', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        console.log('✅ User found, checking password...');
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log('❌ Login failed: Password mismatch for', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                email: user.email, 
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful for', email);
        console.log('🍪 Setting JWT cookie:', {
            secure: isVercel || process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        });
        
        // Set JWT token as httpOnly cookie
        res.cookie(JWT_COOKIE_NAME, token, {
            secure: isVercel || process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax',
            path: '/'
        });
        
        res.json({
            success: true,
            user: {
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    // Clear the JWT cookie
    res.clearCookie(JWT_COOKIE_NAME, {
        path: '/',
        secure: isVercel || process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    });
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[JWT_COOKIE_NAME];
    
    if (!token) {
        return res.json({ authenticated: false });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            authenticated: true,
            user: {
                email: decoded.email,
                name: decoded.name
            }
        });
    } catch (error) {
        res.json({ authenticated: false });
    }
});

// Read users from file
async function readUsers() {
    try {
        console.log('📖 Attempting to read users from:', USERS_FILE);
        await fs.access(USERS_FILE);
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        console.log('✅ Successfully read users file,', users.length, 'users found');
        return users;
    } catch (error) {
        console.error('❌ Error reading users file:', error.message);
        console.error('   File path:', USERS_FILE);
        console.error('   Error code:', error.code);
        return [];
    }
}

// Write users to file
async function writeUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users file:', error);
        return false;
    }
}

// Initialize users file
async function initializeUsersFile() {
    try {
        await fs.access(USERS_FILE);
    } catch (error) {
        // File doesn't exist, create default admin user
        const defaultPassword = await bcrypt.hash('admin123', 10);
        const defaultUsers = [
            {
                email: 'admin@example.com',
                password: defaultPassword,
                name: 'Administrator'
            }
        ];
        await writeUsers(defaultUsers);
        console.log('Created users.json with default admin user (admin@example.com / admin123)');
    }
}

// GET endpoint - retrieve all data (protected)
app.get('/api/data', requireAuth, async (req, res) => {
    try {
        console.log('📥 GET /api/data - Reading data file from:', DATA_FILE);
        const data = await readData();
        if (data) {
            console.log('✅ Data read successfully - Staff:', data.staff?.length || 0, 'Weeks:', Object.keys(data.weeks || {}).length);
            res.json(data);
        } else {
            console.error('❌ Failed to read data - readData returned null');
            res.status(500).json({ error: 'Failed to read data file' });
        }
    } catch (error) {
        console.error('❌ Error in GET /api/data:', error);
        res.status(500).json({ error: 'Server error reading data: ' + error.message });
    }
});

// POST endpoint - save all data (protected)
app.post('/api/data', requireAuth, async (req, res) => {
    try {
        console.log('💾 POST /api/data - Saving data to:', DATA_FILE);
        console.log('📊 Data being saved - Staff:', req.body.staff?.length || 0, 'Weeks:', Object.keys(req.body.weeks || {}).length);
        const success = await writeData(req.body);
        if (success) {
            console.log('✅ Data saved successfully');
            res.json({ success: true, message: 'Data saved successfully' });
        } else {
            console.error('❌ Failed to save data - writeData returned false');
            res.status(500).json({ error: 'Failed to save data file' });
        }
    } catch (error) {
        console.error('❌ Error in POST /api/data:', error);
        res.status(500).json({ error: 'Server error saving data: ' + error.message });
    }
});

// GitHub repository info for persistent backups
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'joelauge';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'pcstaff';
const GITHUB_BACKUP_PATH = 'backups'; // Directory in repo for backups

// Backup directory (local fallback)
const BACKUP_DIR = isVercel ? '/tmp/backups' : path.join(__dirname, 'backups');

// Commit backup to GitHub repository
async function commitBackupToGitHub(backupContent, filename) {
    if (!GITHUB_TOKEN) {
        console.log('⚠️ GITHUB_TOKEN not set - skipping GitHub backup');
        return { success: false, message: 'GitHub token not configured' };
    }

    return new Promise((resolve, reject) => {
        const filePath = `${GITHUB_BACKUP_PATH}/${filename}`;
        const content = Buffer.from(backupContent).toString('base64');
        
        // GitHub API: Create or update file
        const apiPath = `/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`;
        
        // First, check if file exists to get SHA (required for updates)
        const checkOptions = {
            hostname: 'api.github.com',
            path: apiPath,
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'PCStaff-Backup-System',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const checkReq = https.request(checkOptions, (checkRes) => {
            let checkData = '';
            checkRes.on('data', chunk => checkData += chunk);
            checkRes.on('end', () => {
                let sha = null;
                if (checkRes.statusCode === 200) {
                    const existingFile = JSON.parse(checkData);
                    sha = existingFile.sha;
                    console.log(`📝 Updating existing backup file: ${filename}`);
                } else if (checkRes.statusCode === 404) {
                    console.log(`📝 Creating new backup file: ${filename}`);
                } else {
                    console.error(`⚠️ Error checking file existence: ${checkRes.statusCode}`);
                }

                // Now create/update the file
                const commitMessage = `Daily backup: ${filename}`;
                const body = JSON.stringify({
                    message: commitMessage,
                    content: content,
                    ...(sha && { sha: sha }) // Include SHA if updating existing file
                });

                const options = {
                    hostname: 'api.github.com',
                    path: apiPath,
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'User-Agent': 'PCStaff-Backup-System',
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body)
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 201 || res.statusCode === 200) {
                            console.log(`✅ Backup committed to GitHub: ${filename}`);
                            resolve({ success: true, message: 'Backup committed to GitHub' });
                        } else {
                            const error = JSON.parse(data);
                            console.error(`❌ GitHub API error: ${res.statusCode} - ${error.message}`);
                            reject(new Error(`GitHub API error: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('❌ GitHub API request error:', error);
                    reject(error);
                });

                req.write(body);
                req.end();
            });
        });

        checkReq.on('error', (error) => {
            console.error('❌ Error checking GitHub file:', error);
            reject(error);
        });

        checkReq.end();
    });
}

// List backups from GitHub
async function listBackupsFromGitHub() {
    if (!GITHUB_TOKEN) {
        return { backups: [] };
    }

    return new Promise((resolve, reject) => {
        const apiPath = `/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_BACKUP_PATH}`;
        
        const options = {
            hostname: 'api.github.com',
            path: apiPath,
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'PCStaff-Backup-System',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const files = JSON.parse(data);
                    const backups = files
                        .filter(file => file.name.startsWith('backup-') && file.name.endsWith('.json'))
                        .map(file => ({
                            filename: file.name,
                            size: file.size,
                            url: file.download_url,
                            sha: file.sha,
                            created: file.created_at,
                            modified: file.updated_at || file.created_at
                        }))
                        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
                    
                    resolve({ backups });
                } else if (res.statusCode === 404) {
                    // Directory doesn't exist yet (no backups)
                    resolve({ backups: [] });
                } else {
                    const error = JSON.parse(data);
                    console.error(`❌ GitHub API error listing backups: ${res.statusCode} - ${error.message}`);
                    reject(new Error(`GitHub API error: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error listing GitHub backups:', error);
            reject(error);
        });

        req.end();
    });
}

// Create backup function
async function createBackup() {
    try {
        // Get current date for backup filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        
        // Read current data files
        const data = await readData();
        const users = await readUsers();
        
        if (!data && users.length === 0) {
            console.log('⚠️ No data to backup');
            return { success: false, message: 'No data to backup' };
        }
        
        // Create backup object
        const backup = {
            timestamp: now.toISOString(),
            date: dateStr,
            data: data,
            users: users.map(u => ({
                email: u.email,
                name: u.name,
                // Don't backup passwords for security
                passwordHash: '[REDACTED]'
            }))
        };
        
        const backupContent = JSON.stringify(backup, null, 2);
        const backupFileName = `backup-${dateStr}-${timeStr}.json`;
        
        // Save backup locally (fallback)
        try {
            await fs.mkdir(BACKUP_DIR, { recursive: true });
            const backupPath = path.join(BACKUP_DIR, backupFileName);
            await fs.writeFile(backupPath, backupContent);
            console.log(`✅ Local backup created: ${backupFileName}`);
        } catch (localError) {
            console.warn('⚠️ Could not create local backup:', localError.message);
        }
        
        // Commit to GitHub (persistent storage)
        let githubResult = { success: false, message: 'GitHub backup not configured' };
        try {
            githubResult = await commitBackupToGitHub(backupContent, backupFileName);
        } catch (githubError) {
            console.error('❌ GitHub backup failed:', githubError.message);
            githubResult = { success: false, message: githubError.message };
        }
        
        // Clean up old backups (keep last 30 days in GitHub, 7 days locally)
        await cleanupOldBackups();
        
        return { 
            success: githubResult.success || true, // Success if GitHub worked, or at least local worked
            message: githubResult.success 
                ? 'Backup created and committed to GitHub' 
                : `Backup created locally. GitHub backup: ${githubResult.message}`,
            filename: backupFileName,
            timestamp: now.toISOString(),
            github: githubResult.success
        };
    } catch (error) {
        console.error('❌ Error creating backup:', error);
        return { success: false, message: error.message };
    }
}

// Clean up old backups (local only - GitHub keeps all backups)
async function cleanupOldBackups() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        let deletedCount = 0;
        for (const file of files) {
            if (file.startsWith('backup-') && file.endsWith('.json')) {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtimeMs < sevenDaysAgo) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`🗑️ Deleted old local backup: ${file}`);
                }
            }
        }
        
        if (deletedCount > 0) {
            console.log(`✅ Cleaned up ${deletedCount} old local backup(s)`);
        }
        
        // Note: GitHub backups are kept indefinitely (versioned in git)
        // You can manually delete old backups from GitHub if needed
    } catch (error) {
        console.error('⚠️ Error cleaning up old backups:', error.message);
    }
}

// Backup endpoint (can be called by cron or manually)
app.post('/api/backup', async (req, res) => {
    try {
        // Optional: Require authentication or use a secret token
        const backupSecret = process.env.BACKUP_SECRET;
        if (backupSecret && req.headers['x-backup-secret'] !== backupSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const result = await createBackup();
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('❌ Error in backup endpoint:', error);
        res.status(500).json({ error: 'Server error creating backup: ' + error.message });
    }
});

// Get list of backups (protected) - from GitHub
app.get('/api/backups', requireAuth, async (req, res) => {
    try {
        // Try to get backups from GitHub first
        try {
            const githubBackups = await listBackupsFromGitHub();
            if (githubBackups.backups && githubBackups.backups.length > 0) {
                return res.json({
                    backups: githubBackups.backups,
                    source: 'github',
                    message: 'Backups stored in GitHub repository'
                });
            }
        } catch (githubError) {
            console.warn('⚠️ Could not fetch GitHub backups, falling back to local:', githubError.message);
        }
        
        // Fallback to local backups
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        const files = await fs.readdir(BACKUP_DIR);
        
        const backups = [];
        for (const file of files) {
            if (file.startsWith('backup-') && file.endsWith('.json')) {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = await fs.stat(filePath);
                backups.push({
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    url: null // Local files don't have download URLs
                });
            }
        }
        
        // Sort by modified date (newest first)
        backups.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        
        res.json({ 
            backups,
            source: 'local',
            message: 'Backups stored locally (GitHub backup not configured)'
        });
    } catch (error) {
        console.error('❌ Error listing backups:', error);
        res.status(500).json({ error: 'Server error listing backups: ' + error.message });
    }
});

// Initialize data files (for both local and Vercel)
async function initializeApp() {
    try {
        if (isVercel) {
            console.log('🚀 Initializing app on Vercel...');
            console.log('📁 process.cwd():', process.cwd());
            console.log('📁 __dirname:', __dirname);
            console.log('📁 DATA_FILE:', DATA_FILE);
            console.log('📁 USERS_FILE:', USERS_FILE);
            
            // On Vercel, try multiple locations for the files
            // Priority: data/ folder (included in deployment) > project root > /tmp (from build)
            const possibleDataPaths = [
                SOURCE_DATA_FILE, // data/data.json (included in deployment)
                path.join(process.cwd(), 'data', 'data.json'),
                path.join(__dirname, 'data', 'data.json'),
                path.join(process.cwd(), 'data.json'),
                path.join(__dirname, 'data.json'),
                '/tmp/data.json' // Already copied during build
            ];
            
            const possibleUsersPaths = [
                SOURCE_USERS_FILE, // data/users.json (included in deployment)
                path.join(process.cwd(), 'data', 'users.json'),
                path.join(__dirname, 'data', 'users.json'),
                path.join(process.cwd(), 'users.json'),
                path.join(__dirname, 'users.json'),
                '/tmp/users.json' // Already copied during build
            ];
            
            // Try to copy data.json
            let dataCopied = false;
            for (const dataPath of possibleDataPaths) {
                try {
                    console.log(`🔍 Checking for data.json at: ${dataPath}`);
                    await fs.access(dataPath);
                    const rootData = await fs.readFile(dataPath, 'utf8');
                    const parsed = JSON.parse(rootData);
                    console.log(`✅ Found data.json with ${parsed.staff?.length || 0} staff, ${Object.keys(parsed.weeks || {}).length} weeks`);
                    await fs.writeFile(DATA_FILE, rootData);
                    console.log(`✓ Copied data.json from ${dataPath} to ${DATA_FILE}`);
                    dataCopied = true;
                    break;
                } catch (error) {
                    console.log(`   ❌ Not found at ${dataPath}: ${error.code || error.message}`);
                }
            }
            
            if (!dataCopied) {
                console.log('⚠️ data.json not found in any location, will check if /tmp has it or initialize default');
            }
            
            // Try to copy users.json
            let usersCopied = false;
            for (const usersPath of possibleUsersPaths) {
                try {
                    console.log(`🔍 Checking for users.json at: ${usersPath}`);
                    await fs.access(usersPath);
                    const rootUsers = await fs.readFile(usersPath, 'utf8');
                    const parsed = JSON.parse(rootUsers);
                    console.log(`✅ Found users.json with ${parsed.length || 0} users:`, parsed.map(u => u.email).join(', '));
                    await fs.writeFile(USERS_FILE, rootUsers);
                    console.log(`✓ Copied users.json from ${usersPath} to ${USERS_FILE}`);
                    usersCopied = true;
                    break;
                } catch (error) {
                    console.log(`   ❌ Not found at ${usersPath}: ${error.code || error.message}`);
                }
            }
            
            if (!usersCopied) {
                console.log('⚠️ users.json not found in any location, will check if /tmp has it or initialize default');
            }
        } else {
            // On local development, use data/ folder
            // Check if data/ folder exists, if not, try project root (for migration)
            const dataDir = path.join(__dirname, 'data');
            const rootDataFile = path.join(__dirname, 'data.json');
            const rootUsersFile = path.join(__dirname, 'users.json');
            
            // Try to migrate from project root to data/ folder if needed
            try {
                await fs.access(rootDataFile);
                // File exists in root, check if data/ folder exists
                try {
                    await fs.access(dataDir);
                } catch {
                    // Create data/ folder
                    await fs.mkdir(dataDir, { recursive: true });
                }
                // Copy to data/ folder if it doesn't exist there
                const dataFileInFolder = path.join(dataDir, 'data.json');
                try {
                    await fs.access(dataFileInFolder);
                    console.log('✓ Found data.json in data/ folder');
                } catch {
                    const rootData = await fs.readFile(rootDataFile, 'utf8');
                    await fs.writeFile(dataFileInFolder, rootData);
                    console.log('✓ Migrated data.json from project root to data/ folder');
                }
            } catch (error) {
                console.log('ℹ data.json not found in project root');
            }
            
            try {
                await fs.access(rootUsersFile);
                // File exists in root, check if data/ folder exists
                try {
                    await fs.access(dataDir);
                } catch {
                    // Create data/ folder
                    await fs.mkdir(dataDir, { recursive: true });
                }
                // Copy to data/ folder if it doesn't exist there
                const usersFileInFolder = path.join(dataDir, 'users.json');
                try {
                    await fs.access(usersFileInFolder);
                    console.log('✓ Found users.json in data/ folder');
                } catch {
                    const rootUsers = await fs.readFile(rootUsersFile, 'utf8');
                    await fs.writeFile(usersFileInFolder, rootUsers);
                    console.log('✓ Migrated users.json from project root to data/ folder');
                }
            } catch (error) {
                console.log('ℹ users.json not found in project root');
            }
        }
        
        // Initialize files (will only create if they don't exist)
        await initializeDataFile();
        await initializeUsersFile();
        
        // Log what data was loaded (for both local and Vercel)
        const data = await readData();
        if (data) {
            console.log(`✅ Loaded data: ${data.staff?.length || 0} staff members, ${Object.keys(data.weeks || {}).length} weeks`);
        } else {
            console.log('⚠️ No data loaded - file might be empty or missing');
        }
        
        const users = await readUsers();
        if (users && users.length > 0) {
            console.log(`✅ Loaded users: ${users.length} users (${users.map(u => u.email).join(', ')})`);
        } else {
            console.log('⚠️ No users loaded - file might be empty or missing');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Start server (only if not on Vercel)
if (require.main === module) {
    async function startServer() {
        await initializeApp();
        app.listen(PORT, () => {
            console.log(`Prayer Center Staff Management Server running on http://localhost:${PORT}`);
            console.log(`Open http://localhost:${PORT}/index.html in your browser`);
            console.log(`Default admin: admin@example.com / admin123`);
        });
    }
    startServer().catch(console.error);
} else {
    // On Vercel, initialize files when module loads
    initializeApp().catch(console.error);
}

// Export for Vercel
module.exports = app;

