# Daily Backup Setup

This application includes a daily backup system that saves `data.json` and `users.json` at midnight UTC.

## Backup Methods

### Option 1: Vercel Cron Jobs (Recommended for Pro/Enterprise)

Vercel Cron Jobs are configured in `vercel.json` to run daily at midnight UTC. This is the simplest option if you have a Vercel Pro or Enterprise plan.

**Setup:**
1. No additional setup needed - cron is already configured in `vercel.json`
2. Set `BACKUP_SECRET` environment variable in Vercel dashboard (optional but recommended)
3. Backups will be created automatically at midnight UTC

**Note:** Vercel Cron Jobs are only available on Pro/Enterprise plans. For Hobby/Free plans, use Option 2 or 3.

### Option 2: GitHub Actions (Free)

GitHub Actions can trigger the backup endpoint daily. This is free and works with any Vercel plan.

**Setup:**
1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add the following secrets:
   - `VERCEL_BACKUP_URL`: Your Vercel app URL + `/api/backup` (e.g., `https://your-app.vercel.app/api/backup`)
   - `BACKUP_SECRET`: A secret token (optional but recommended - set this in Vercel environment variables too)

4. The workflow file (`.github/workflows/daily-backup.yml`) is already configured and will run automatically

**To manually trigger a backup:**
- Go to Actions tab in GitHub
- Select "Daily Backup" workflow
- Click "Run workflow"

### Option 3: External Cron Service (Free)

Use a free cron service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com).

**Setup:**
1. Create an account on a cron service
2. Create a new cron job:
   - **URL**: `https://your-app.vercel.app/api/backup`
   - **Method**: POST
   - **Schedule**: Daily at midnight UTC (`0 0 * * *`)
   - **Headers**: 
     - `x-backup-secret`: (your secret token - optional)
     - `Content-Type`: `application/json`

3. Set `BACKUP_SECRET` environment variable in Vercel dashboard (if using secret)

## Backup Storage

- **Local Development**: Backups are saved to `./backups/` directory
- **Vercel**: Backups are saved to `/tmp/backups/` (ephemeral - only lasts during function execution)

**Important:** Vercel's `/tmp` directory is ephemeral and doesn't persist between deployments. For permanent backups, consider:

1. **Committing backups to GitHub** (modify backup function to use GitHub API)
2. **Using external storage** (S3, Google Cloud Storage, etc.)
3. **Emailing backups** (modify backup function to send via email)

## Backup Retention

- Backups older than 7 days are automatically deleted
- Each backup file is named: `backup-YYYY-MM-DD-HH-MM-SS.json`

## Manual Backup

You can manually trigger a backup by:

1. **API Call:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/backup \
     -H "x-backup-secret: YOUR_SECRET" \
     -H "Content-Type: application/json"
   ```

2. **From Code:** The backup endpoint is at `/api/backup`

## Viewing Backups

- **API Endpoint:** `GET /api/backups` (requires authentication)
- Returns list of all backup files with metadata

## Security

- The backup endpoint can be protected with a `BACKUP_SECRET` environment variable
- Set `x-backup-secret` header when calling the endpoint
- If `BACKUP_SECRET` is not set, the endpoint is publicly accessible (not recommended for production)

## Backup File Format

```json
{
  "timestamp": "2024-01-15T00:00:00.000Z",
  "date": "2024-01-15",
  "data": { ... }, // Full data.json content
  "users": [       // User data (passwords redacted)
    {
      "email": "user@example.com",
      "name": "User Name",
      "passwordHash": "[REDACTED]"
    }
  ]
}
```

