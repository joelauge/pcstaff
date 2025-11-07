# Prayer Center Staff Management - Daily Team Leader Report

A simple, user-friendly web application for managing prayer center staff schedules and daily reports.

## Features

- **Authentication**: Email/password login system with session management
- **Staff Management**: Add and remove staff members from the roster
- **Schedule Management**: Manage staff schedules for each day of the week
- **Week Navigation**: Navigate between different weeks of the year
- **Shift Customization**: Edit shift times and assign staff to shifts
- **Role Management**: Assign roles (Team Leader, Shift Captain, etc.) to staff members
- **Notes**: Add special instructions for each shift and additional notes for the week
- **Data Persistence**: All data is automatically saved to a JSON file on the server

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher) installed on your system
- npm (comes with Node.js)

### Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   - The server will start on `http://localhost:3000`
   - Open `http://localhost:3000/index.html` in your web browser
   - Login with the default credentials (see below)
   - The app will load with default staff members from your original document
   - All data is automatically saved to `data.json` as you make changes

### Default Login Credentials

On first run, a default admin user is created:
- **Email**: `admin@example.com`
- **Password**: `admin123`

**Important**: Change the default password immediately after first login by editing `users.json` or using a password reset utility.

### Adding Users

To add new users, edit the `users.json` file. You'll need to hash passwords using bcrypt. You can use this Node.js snippet:

```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

Then add to `users.json`:
```json
[
  {
    "email": "user@example.com",
    "password": "hashed-password-here",
    "name": "User Name"
  }
]
```

### Running the Application

- **Start Server**: `npm start` or `node server.js`
- **Stop Server**: Press `Ctrl+C` in the terminal
- The server will create `data.json` and `users.json` automatically on first run

### Managing Staff

- **Add Staff**: Type a name in the "Enter staff name" field and click "Add Staff Member" or press Enter
- **Remove Staff**: Click the "×" button next to any staff member's name
  - Note: Removing a staff member will also remove them from all shifts

### Managing Schedules

1. Select a week using the week picker or navigation buttons
2. Click on any day of the week in the navigation bar
3. For each shift:
   - **Edit Shift Time**: Change the time in the shift header
   - **Add Staff**: Click "+ Add Staff Member" button
   - **Assign Staff**: Select a staff member from the dropdown
   - **Add Role**: Enter a role (e.g., "Team Leader", "Shift Captain") in the role field
   - **Custom Time**: Enter a custom time if the staff member's shift differs from the default
   - **Remove Staff**: Click "Remove" button next to any staff entry
   - **Special Instructions**: Add notes about the shift in the text area

### Additional Notes

- Click "Additional Notes" in the navigation
- Use this page for team prayer requests, updates, and information sharing
- All notes are automatically saved per week

### Date Management

- Each day has a date picker at the top
- Select the appropriate date for each week
- Dates are automatically saved per week

## Technical Details

- **Storage**: Data is stored in `data.json` file on the server
- **Users**: User accounts stored in `users.json` with bcrypt-hashed passwords
- **Authentication**: Session-based authentication using express-session
- **Server**: Lightweight Node.js/Express server (runs on port 3000)
- **Database**: Simple JSON file-based storage (no database required)
- **Browser Compatibility**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Security**: Passwords are hashed using bcrypt, sessions are protected

## File Structure

```
PCStaff/
├── index.html          # Main HTML file
├── styles.css          # Styling and layout
├── app.js              # Application logic (client-side)
├── auth.js             # Authentication logic (client-side)
├── server.js           # Node.js server
├── package.json        # Node.js dependencies
├── data.json           # Data storage file (created automatically)
├── users.json          # User accounts file (created automatically)
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Data Storage

- All data is stored in `data.json` in the project directory
- User accounts are stored in `users.json`
- Files are automatically created when the server starts
- Data persists across browser sessions and cache clears
- You can backup the data by simply copying `data.json` and `users.json`
- Files are human-readable JSON format

## Privacy & Security

- All data is stored locally on your server/machine
- No data is sent to any external servers
- The server only runs locally (localhost:3000)
- Passwords are hashed using bcrypt (industry standard)
- Sessions expire after 24 hours of inactivity
- Your information stays private and secure
- Perfect for internal use only

## Security Recommendations

1. **Change Default Password**: Immediately change the default admin password
2. **Session Secret**: Set `SESSION_SECRET` environment variable for production:
   ```bash
   export SESSION_SECRET="your-secure-random-string-here"
   ```
3. **HTTPS**: Use HTTPS in production and set `secure: true` in session cookie config
4. **Regular Backups**: Regularly backup `data.json` and `users.json`

## Troubleshooting

**Server won't start?**
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is already in use

**Can't login?**
- Check that `users.json` exists and has valid user entries
- Verify email and password are correct
- Check server console for errors

**Data not saving?**
- Make sure the server is running
- Check that `data.json` exists and is writable
- Look for error messages in the server console
- Verify you're logged in (session may have expired)

**Staff not appearing in dropdowns?**
- Make sure you've added the staff member using the "Add Staff Member" button
- Refresh the page if needed
- Check the browser console for errors

**Want to start fresh?**
- Click the "Reset to Original" button in the app (resets current week only)
- Or delete `data.json` and restart the server

**Session expired?**
- Simply log in again
- Sessions last 24 hours by default

## Support

For issues or questions, please contact your IT department or the person who set up this application.
