# Deploying data.json and users.json to Vercel

## Method 1: Using Vercel CLI (Recommended)

You can deploy these files directly to Vercel without committing them to GitHub:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy files directly**:
   ```bash
   # Deploy data.json
   vercel --prod data.json
   
   # Deploy users.json  
   vercel --prod users.json
   ```

However, this won't work as expected because Vercel needs these files in the project directory.

## Method 2: Include in Deployment (Current Setup)

The current setup will:
- **NOT commit** `data.json` and `users.json` to GitHub (they're in `.gitignore`)
- **Initialize** them on Vercel during build if they don't exist
- **Copy** them from project root to `/tmp` if they exist in your local project

### To Deploy Your Current Files:

1. **Make sure files exist locally** (they should already):
   - `data.json` - your current data
   - `users.json` - your current users

2. **Deploy using Vercel CLI**:
   ```bash
   vercel --prod
   ```
   
   This will include the files in the deployment package but NOT commit them to git.

3. **Or use Vercel Dashboard**:
   - Go to your project settings
   - Use "Deploy" → "Upload" to manually include the files

## Method 3: Environment Variables (For users.json)

For sensitive data like users, you could also:
- Store user data as environment variables
- Or use Vercel's built-in authentication
- Or use a database service

## Current Behavior

- Files are **excluded from git** (`.gitignore`)
- Files are **included in Vercel deployments** when you deploy
- Files are **initialized** if they don't exist on first run
- Files are **stored in `/tmp`** on Vercel (ephemeral - may be lost)

## Important Note

Since Vercel uses ephemeral storage (`/tmp`), your data files will be lost on:
- Function cold starts
- New deployments
- Function instance restarts

For production, consider migrating to persistent storage (Vercel Postgres, etc.).

