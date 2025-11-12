# How to Deploy with Local Data Files to Vercel

## The Problem

When Vercel builds from GitHub, `data.json` and `users.json` are NOT included because they're in `.gitignore`. The build logs show:

```
📂 Files in project root: package-lock.json, package.json, vercel.json
```

Notice `data.json` and `users.json` are missing!

## Solution: Deploy with Local Files

When you run `vercel --prod`, Vercel CLI should include local files even if they're gitignored. However, if Vercel is configured to auto-deploy from GitHub, it might use the GitHub version instead.

### Option 1: Force Local Deployment (Recommended)

1. **Make sure you're in the project root:**
   ```bash
   cd /Users/jauge/Development/PCStaff
   ```

2. **Verify files exist:**
   ```bash
   ls -la data.json users.json
   ```

3. **Deploy with local files:**
   ```bash
   vercel --prod --force
   ```

   The `--force` flag ensures it uses local files.

### Option 2: Temporarily Commit Files (Not Recommended for Security)

If Option 1 doesn't work, you could temporarily commit the files:

1. Remove from `.gitignore` temporarily
2. Commit and push
3. Deploy
4. Add back to `.gitignore` and remove from git (but keep locally)

**⚠️ WARNING:** This exposes your data and user passwords in git history. Only do this if absolutely necessary.

### Option 3: Use Vercel Environment Variables

For `users.json`, you could store user credentials as environment variables instead of a file. This is more secure but requires code changes.

## Verify Deployment

After deploying, check the build logs. You should see:

```
✅ Found data.json with X staff, Y weeks
✅ Found users.json with 2 users: gwilloughby@crossroads.ca, jauge@crossroads.ca
✓ Copied data.json from ... to /tmp/data.json
✓ Copied users.json from ... to /tmp/users.json
```

If you see `⚠️ data.json not found`, the files weren't included in the deployment.

