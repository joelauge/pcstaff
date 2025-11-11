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
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
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
            additionalNotes: {}
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
        console.log('Created initial data.json file');
    }
}

// Read data from file
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return null;
    }
}

// Write data to file
async function writeData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const users = await readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Set session
        req.session.user = {
            email: user.email,
            name: user.name
        };
        
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
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/check', (req, res) => {
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
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users file:', error);
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
    const data = await readData();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST endpoint - save all data (protected)
app.post('/api/data', requireAuth, async (req, res) => {
    const success = await writeData(req.body);
    if (success) {
        res.json({ success: true, message: 'Data saved successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Initialize data files (for both local and Vercel)
async function initializeApp() {
    try {
        // On Vercel, ALWAYS try to copy from project root first (if files exist)
        // This ensures the latest data is used, even if /tmp already has old data
        if (isVercel) {
            const rootDataFile = path.join(process.cwd(), 'data.json');
            const rootUsersFile = path.join(process.cwd(), 'users.json');
            
            try {
                const rootData = await fs.readFile(rootDataFile, 'utf8');
                await fs.writeFile(DATA_FILE, rootData);
                console.log('✓ Copied data.json from project root to /tmp');
            } catch (error) {
                console.log('ℹ data.json not found in project root, will initialize default');
            }
            
            try {
                const rootUsers = await fs.readFile(rootUsersFile, 'utf8');
                await fs.writeFile(USERS_FILE, rootUsers);
                console.log('✓ Copied users.json from project root to /tmp');
            } catch (error) {
                console.log('ℹ users.json not found in project root, will initialize default');
            }
        }
        
        await initializeDataFile();
        await initializeUsersFile();
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

