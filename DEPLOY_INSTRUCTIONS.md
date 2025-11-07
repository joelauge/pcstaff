# Deploying data.json and users.json to Vercel

## Quick Deploy

Since Vercel no longer supports single-file deployments, you need to deploy the entire project. The good news is that `data.json` and `users.json` are in `.gitignore`, so they won't be committed to GitHub, but they WILL be included when you deploy with Vercel CLI.

### Steps:

1. **Make sure your files exist locally**:
   - `data.json` - your current schedule data
   - `users.json` - your current user accounts

2. **Deploy using Vercel CLI**:
   ```bash
   vercel --prod
   ```
   
   This will:
   - ✅ Include `data.json` and `users.json` in the deployment (even though they're not in git)
   - ✅ Run the build script which copies them to `/tmp` on Vercel
   - ✅ NOT commit them to GitHub

3. **Verify deployment**:
   - Check the Vercel dashboard for build logs
   - Look for messages like "✓ Copied data.json from project root to /tmp"

## How It Works

- **`.gitignore`** - Prevents files from being committed to GitHub
- **`.vercelignore`** - Controls what gets excluded from Vercel deployments (data.json and users.json are NOT excluded)
- **`vercel-build.js`** - Copies files from project root to `/tmp` during build
- **Vercel CLI** - Includes all files in the project directory when deploying (except those in `.vercelignore`)

## Important Notes

⚠️ **Ephemeral Storage**: Files stored in `/tmp` on Vercel are **NOT persistent**. They will be lost on:
- Function cold starts
- New deployments
- Function instance restarts

For production, consider migrating to:
- **Vercel Postgres** - for persistent data storage
- **Vercel KV** - for session storage
- **External database** - MongoDB Atlas, Supabase, etc.

## Alternative: Environment Variables

For `users.json`, you could also store user data as environment variables in Vercel, but this is less convenient for multiple users.

