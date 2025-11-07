# Deployment to Vercel

## Important Notes

### File Storage Limitation

⚠️ **Important**: Vercel serverless functions use an ephemeral filesystem. The `/tmp` directory is writable but data is **not persistent** between deployments or function cold starts.

For production use, consider:
1. **Vercel KV** (Redis) - for session storage
2. **Vercel Postgres** - for persistent data storage
3. **External database** (MongoDB Atlas, Supabase, etc.)

Currently, the app uses `/tmp` for data files, which means:
- Data may be lost on deployment
- Data may be lost on function cold starts
- Multiple function instances won't share data

### Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

1. **SESSION_SECRET** (required for production)
   - Generate a secure random string
   - Example: `openssl rand -base64 32`
   - This is critical for session security

2. **NODE_ENV** (optional)
   - Set to `production` for production deployments
   - Enables secure cookies (HTTPS only)

### Deployment Steps

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `joelauge/pcstaff`
   - Vercel will auto-detect the Node.js configuration

2. **Set Environment Variables**:
   - In Vercel project settings, add:
     - `SESSION_SECRET`: A secure random string
     - `NODE_ENV`: `production`

3. **Deploy**:
   - Vercel will automatically deploy on every push to `main`
   - Or deploy manually from the Vercel dashboard

4. **First Login**:
   - The app will create default admin user on first run
   - Default credentials: `admin@example.com` / `admin123`
   - **Change this immediately after first login!**

### Adding Users

Since the filesystem is ephemeral, you'll need to:
1. Use the `add-user.js` script locally
2. Commit the updated `users.json` to git (temporarily)
3. Or implement a user management API endpoint

### Recommended Next Steps

For production reliability, consider migrating to:
- **Vercel Postgres** for data storage
- **Vercel KV** for session storage
- Or a managed database service

This will ensure data persistence across deployments and function instances.

