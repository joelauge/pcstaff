#!/usr/bin/env node

/**
 * Helper script to add users to the system
 * Usage: node add-user.js <email> <password> <name>
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const USERS_FILE = path.join(__dirname, 'users.json');

async function addUser(email, password, name) {
    try {
        // Read existing users
        let users = [];
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, start with empty array
            console.log('Creating new users.json file...');
        }

        // Check if user already exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            console.error(`User with email ${email} already exists!`);
            process.exit(1);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add new user
        const newUser = {
            email: email,
            password: hashedPassword,
            name: name || email.split('@')[0]
        };

        users.push(newUser);

        // Write back to file
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`✓ User ${email} added successfully!`);
        console.log(`  Name: ${newUser.name}`);
    } catch (error) {
        console.error('Error adding user:', error);
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node add-user.js <email> <password> [name]');
    console.log('');
    console.log('Example:');
    console.log('  node add-user.js user@example.com mypassword123 "John Doe"');
    process.exit(1);
}

const [email, password, name] = args;

// Validate email
if (!email.includes('@')) {
    console.error('Error: Invalid email address');
    process.exit(1);
}

// Validate password
if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters');
    process.exit(1);
}

addUser(email, password, name).catch(console.error);

