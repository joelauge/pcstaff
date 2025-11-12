# Deploying Data to Vercel Production

## Important: Deploying with Local Data Files

When you run `vercel --prod`, Vercel CLI includes **all files** in your project directory, including `data.json` and `users.json` (even though they're in `.gitignore`).

## Steps to Deploy with Your Local Data:

1. **Make sure you're in the project root directory:**
   ```bash
   cd /Users/jauge/Development/PCStaff
   ```

2. **Verify your data files exist:**
   ```bash
   ls -la data.json users.json
   ```
   You should see both files listed.

3. **Deploy to production:**
   ```bash
   vercel --prod
   ```

4. **What happens during deployment:**
   - Vercel CLI uploads all files (including `data.json` and `users.json`)
   - The build script (`vercel-build.js`) runs
   - The build script copies `data.json` and `users.json` from project root to `/tmp`
   - The server initialization also copies these files to `/tmp` as a backup
   - Your production site will have all your local data

## Troubleshooting:

### If data doesn't appear on production:

1. **Check Vercel build logs:**
   - Go to your Vercel dashboard
   - Click on the deployment
   - Check the "Build Logs" tab
   - Look for messages like:
     - `✓ Copied data.json from ... to /tmp`
     - `✓ data.json exists`

2. **Verify files are being uploaded:**
   - The build logs should show the files being found and copied
   - If you see `ℹ data.json not found in any expected location`, the files weren't included in the deployment

3. **Re-deploy:**
   - Make sure you're in the correct directory
   - Run `vercel --prod` again
   - The files should be included this time

## Note:

- `data.json` and `users.json` are **NOT** committed to git (they're in `.gitignore`)
- They **ARE** included when you run `vercel --prod` locally
- They are **NOT** included in automatic deployments from git (only manual `vercel --prod` includes them)

