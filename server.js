const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Use /tmp directory on Vercel (serverless functions have read-only filesystem except /tmp)
// For local development, use current directory
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Middleware
// Trust proxy on Vercel (important for cookies and sessions)
app.set('trust proxy', 1);

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'prayer-center-staff-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // On Vercel, we're behind a proxy with HTTPS, so secure should be true
        secure: isVercel || process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // 'lax' works for same-site cookies (frontend and API on same domain)
        // Don't set domain - let browser handle it
    }
}));

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

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
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
        
        // Set session
        req.session.user = {
            email: user.email,
            name: user.name
        };
        
        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to create session' });
            }
            
            console.log('Login successful for', email, 'Session ID:', req.sessionID);
            
            res.json({
                success: true,
                user: {
                    email: user.email,
                    name: user.name
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/check', (req, res) => {
    console.log('Auth check - Session ID:', req.sessionID, 'User:', req.session?.user);
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
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
            // Files might be in the deployment bundle or need to be copied from build
            const possibleDataPaths = [
                path.join(process.cwd(), 'data.json'),
                path.join(__dirname, 'data.json'),
                path.join(process.cwd(), '..', 'data.json'),
                '/tmp/data.json' // Already copied during build
            ];
            
            const possibleUsersPaths = [
                path.join(process.cwd(), 'users.json'),
                path.join(__dirname, 'users.json'),
                path.join(process.cwd(), '..', 'users.json'),
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
            // On local development, check if files exist in project root
            // If they exist, use them directly (DATA_FILE already points to __dirname/data.json)
            const rootDataFile = path.join(__dirname, 'data.json');
            const rootUsersFile = path.join(__dirname, 'users.json');
            
            try {
                await fs.access(rootDataFile);
                console.log('✓ Found data.json in project root, using existing file');
            } catch (error) {
                console.log('ℹ data.json not found, will initialize default');
            }
            
            try {
                await fs.access(rootUsersFile);
                console.log('✓ Found users.json in project root, using existing file');
            } catch (error) {
                console.log('ℹ users.json not found, will initialize default');
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

