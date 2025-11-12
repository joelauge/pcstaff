#!/usr/bin/env node

/**
 * Build script for Vercel deployment
 * Initializes data.json and users.json if they don't exist
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = process.env.VERCEL ? '/tmp' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function initializeFiles() {
    try {
        // On Vercel, ALWAYS try to copy from project root first (if files exist)
        // This ensures the latest data is used, even if /tmp already has old data
        if (process.env.VERCEL) {
            console.log('🔍 Vercel build detected, looking for data files...');
            console.log('📁 Current working directory:', process.cwd());
            console.log('📁 __dirname:', __dirname);
            
            // Try multiple possible locations for the files
            const possibleDataPaths = [
                path.join(process.cwd(), 'data.json'),
                path.join(__dirname, 'data.json'),
                path.join(process.cwd(), '..', 'data.json')
            ];
            
            const possibleUsersPaths = [
                path.join(process.cwd(), 'users.json'),
                path.join(__dirname, 'users.json'),
                path.join(process.cwd(), '..', 'users.json')
            ];
            
            // Try to copy data.json from project root
            let dataCopied = false;
            for (const dataPath of possibleDataPaths) {
                try {
                    console.log(`🔍 Checking for data.json at: ${dataPath}`);
                    const rootData = await fs.readFile(dataPath, 'utf8');
                    await fs.writeFile(DATA_FILE, rootData);
                    console.log(`✓ Copied data.json from ${dataPath} to /tmp`);
                    dataCopied = true;
                    break;
                } catch (error) {
                    // Continue to next path
                }
            }
            
            if (!dataCopied) {
                console.log('ℹ data.json not found in any expected location, will initialize default');
            }
            
            // Try to copy users.json from project root
            let usersCopied = false;
            for (const usersPath of possibleUsersPaths) {
                try {
                    console.log(`🔍 Checking for users.json at: ${usersPath}`);
                    const rootUsers = await fs.readFile(usersPath, 'utf8');
                    await fs.writeFile(USERS_FILE, rootUsers);
                    console.log(`✓ Copied users.json from ${usersPath} to /tmp`);
                    usersCopied = true;
                    break;
                } catch (error) {
                    // Continue to next path
                }
            }
            
            if (!usersCopied) {
                console.log('ℹ users.json not found in any expected location, will initialize default');
            }
        }

        // Initialize data.json if it doesn't exist
        try {
            await fs.access(DATA_FILE);
            console.log('✓ data.json exists');
        } catch (error) {
            const today = new Date();
            const year = today.getFullYear();
            const weekNumber = Math.ceil((today - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
            const currentWeek = `${year}-W${String(weekNumber).padStart(2, '0')}`;
            
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
            console.log('✓ Created default data.json');
        }

        // Initialize users.json if it doesn't exist
        try {
            await fs.access(USERS_FILE);
            console.log('✓ users.json exists');
        } catch (error) {
            const defaultPassword = await bcrypt.hash('admin123', 10);
            const defaultUsers = [
                {
                    email: 'admin@example.com',
                    password: defaultPassword,
                    name: 'Administrator'
                }
            ];
            
            await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
            console.log('✓ Created default users.json');
        }
        
        console.log('✓ Build script completed successfully');
    } catch (error) {
        console.error('✗ Error in build script:', error);
        process.exit(1);
    }
}

initializeFiles();

