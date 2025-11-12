// Application State
const appState = {
    staff: [],
    currentWeek: '', // ISO week string (e.g., "2026-W01")
    weeks: {}, // Object with week keys containing day data
    additionalNotes: {}, // Object with week keys containing notes
    staffProfiles: {} // Object with staff name as key, containing profile data
};

// Helper function to get week start date (Sunday) from a date
function getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
}

// Helper function to get ISO week string from a date (YYYY-Www format)
function getWeekString(date) {
    const d = new Date(date);
    const weekStart = getWeekStartDate(d);
    const year = weekStart.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((weekStart - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper function to get Sunday date from week string
function getSundayFromWeek(weekString) {
    const [year, week] = weekString.split('-W').map(Number);
    const startOfYear = new Date(year, 0, 1);
    const startDay = startOfYear.getDay();
    const daysToAdd = (week - 1) * 7 - startDay;
    const sunday = new Date(year, 0, 1 + daysToAdd);
    return sunday;
}

// Get current week's data structure
function getCurrentWeekData() {
    if (!appState.weeks[appState.currentWeek]) {
        appState.weeks[appState.currentWeek] = {
            sunday: { date: '', shifts: [] },
            monday: { date: '', shifts: [] },
            tuesday: { date: '', shifts: [] },
            wednesday: { date: '', shifts: [] },
            thursday: { date: '', shifts: [] },
            friday: { date: '', shifts: [] },
            saturday: { date: '', shifts: [] }
        };
    }
    return appState.weeks[appState.currentWeek];
}

// Get current week's days
function getCurrentDays() {
    return getCurrentWeekData();
}

// Default shift times for each day
const defaultShifts = {
    sunday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4pm-12am' }
    ],
    monday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4:00pm-12:00am' }
    ],
    tuesday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4pm-12am' }
    ],
    wednesday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4pm-12am' }
    ],
    thursday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4pm-12am' }
    ],
    friday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4pm-12am' }
    ],
    saturday: [
        { name: 'Overnight', time: '12am-8am' },
        { name: 'Day', time: '8:00am-4:00pm' },
        { name: 'Evening', time: '4:00pm-12:00am' }
    ]
};

// Initialize default shifts structure for a week
function initializeShifts(weekData) {
    Object.keys(weekData).forEach(day => {
        if (!weekData[day].shifts || weekData[day].shifts.length === 0) {
            weekData[day].shifts = defaultShifts[day].map(shift => ({
                name: shift.name,
                time: shift.time,
                staff: [],
                specialInstructions: ''
            }));
        }
    });
}

// Initialize with data from original document for a specific week
function initializeWithOriginalData(weekData) {
    // Ensure default staff are in the roster
    if (!appState.staff || appState.staff.length === 0) {
        appState.staff = [...DEFAULT_STAFF];
    } else {
        // Merge default staff with existing
        DEFAULT_STAFF.forEach(staff => {
            if (!appState.staff.includes(staff)) {
                appState.staff.push(staff);
            }
        });
        appState.staff.sort();
    }
    
    // Initialize shifts for this week
    initializeShifts(weekData);
    
    // Sunday initial data
    weekData.sunday.shifts[0].staff = [
        { name: 'Pat Bailey', role: 'Team Leader', time: '12am-8am' },
        { name: 'Richard Helmer', role: '', time: '12am-8am' },
        { name: 'Dawn Sears', role: '', time: '12am-8am' },
        { name: 'Jennifer Isaiah-Lawal', role: '', time: '12am-8am' },
        { name: 'Carmen Quesada', role: '', time: '12am-8am' },
        { name: 'John Rhee', role: '', time: '12am-8am' }
    ];
    weekData.sunday.shifts[1].staff = [
        { name: 'Gloria Rankin', role: 'Works e/o week: alt. Shift Captain', time: '8:00am-4:00pm' },
        { name: 'Penny Spence', role: 'works every week, but e/o week as TL', time: '8:00am-4:00pm' },
        { name: 'Ruth Stockdale', role: 'works e/o alt. week with Penny', time: '8:00am-4:00pm' },
        { name: 'Joyce Frederick', role: '', time: '8:00am-4:00pm' },
        { name: 'Marilyn Khasnabish', role: '', time: '8:00am-4:00pm' },
        { name: 'Cathy Bard', role: '', time: '8:00am-4:00pm' },
        { name: 'Delani Chinnappah', role: '', time: '8:00am-4:00pm' }
    ];
    weekData.sunday.shifts[2].staff = [
        { name: 'Valerie Masinzo', role: 'Team Leader', time: '4pm-12am' },
        { name: 'Lois Walker', role: '', time: '4pm-12pm' },
        { name: 'Coral Jones', role: '', time: '4pm-12am' },
        { name: 'Benjamin Paul', role: '', time: '4pm-12am' },
        { name: 'Chris O\'Connor', role: '', time: '4pm-12am' },
        { name: 'Katie Meilleur', role: '', time: '4pm-12am' }
    ];
    
    // Monday initial data
    weekData.monday.shifts[0].staff = [
        { name: 'David Piper', role: 'Shift Captain', time: '12am-8am' },
        { name: 'Richard Helmer', role: '', time: '12am-8am' },
        { name: 'Danette Bloomfield', role: '', time: '12am-8am' },
        { name: 'Dawn Sears', role: '', time: '12am-8am' },
        { name: 'Jennifer Isaiah-Lawal', role: '', time: '12am-8am' },
        { name: 'John Rhee', role: '', time: '12am-8am' }
    ];
    weekData.monday.shifts[1].time = '8:00am-4:00pm';
    weekData.monday.shifts[1].staff = [
        { name: 'Gloria Willoughby', role: '', time: '9:30am-5:30pm' },
        { name: 'Jordan Berta', role: 'Team Leader', time: '8:00am-4:00pm' },
        { name: 'Sharon L-Arndt', role: '', time: '9:30am-5:30pm' },
        { name: 'Ruth Stockdale', role: 'back-up Shift Captain', time: '8:00am-4:00pm' },
        { name: 'Anne Gwaza', role: 'Prayer emails', time: '12:00pm-4:30pm' }
    ];
    weekData.monday.shifts[2].time = '4:00pm-12:00am';
    weekData.monday.shifts[2].staff = [
        { name: 'Carol Gray', role: 'Team Leader', time: '2:00pm-10:00pm' },
        { name: 'Valerie Masinzo', role: '', time: '4:00pm-12:00am' },
        { name: 'Marilyn Khasnabish', role: '', time: '4:00pm-12:00am' },
        { name: 'Benjamin Paul', role: '', time: '8:00pm-12:00am' },
        { name: 'Gloria Rankin', role: '', time: '4:00pm-12:00am' },
        { name: 'Elizabeth Danna', role: 'Voice Mail Requests', time: '4:00pm-12:00am' },
        { name: 'Anne Gwaza', role: 'Prayer Calls', time: '5:00pm-8:00pm' }
    ];
    
    // Tuesday initial data
    weekData.tuesday.shifts[0].staff = [
        { name: 'Pat Bailey', role: 'Team Leader', time: '12am-8am' },
        { name: 'Leonard Hutchinson', role: '', time: '12am-8am' },
        { name: 'David Piper', role: '', time: '12am-8am' },
        { name: 'Dawn Sears', role: '', time: '12am-8am' },
        { name: 'Danette Bloomfield', role: '', time: '12am-8am' },
        { name: 'John Rhee', role: '', time: '12am-8am' }
    ];
    weekData.tuesday.shifts[1].staff = [
        { name: 'Gloria Willoughby', role: '', time: '9:30am-5:30pm' },
        { name: 'Sharon L.-Arndt', role: '', time: '9:30am-5:30pm' },
        { name: 'Jordan Berta', role: 'Team Leader', time: '8:00am-4:00pm' },
        { name: 'Anne Gwaza', role: 'Prayer emails + calls', time: '8:00am-4:00pm' }
    ];
    weekData.tuesday.shifts[2].staff = [
        { name: 'Carol Gray', role: 'Team Leader', time: '2:00pm-10:00pm' },
        { name: 'Coral Jones', role: 'VM Prayer Requests', time: '4pm-12am' },
        { name: 'Gloria Rankin', role: '', time: '4pm-12am' },
        { name: 'Valerie Masinzo', role: '', time: '4pm-12am' },
        { name: 'Marilyn Khasnabish', role: '', time: '4pm-12am' }
    ];
    
    // Wednesday initial data
    weekData.wednesday.shifts[0].staff = [
        { name: 'Leonard Hutchinson', role: 'Shift Captain', time: '12am-8am' },
        { name: 'David Piper', role: '', time: '12am-8am' },
        { name: 'Dawn Sears', role: '', time: '12am-8am' },
        { name: 'Danette Bloomfield', role: '', time: '12am-8am' },
        { name: 'John Rhee', role: '', time: '12am-8am' },
        { name: 'Carmen Quesada', role: '', time: '12am-8am' }
    ];
    weekData.wednesday.shifts[1].staff = [
        { name: 'Gloria Willoughby', role: '', time: '9:30am-5:30pm' },
        { name: 'Sharon L.-Arndt', role: '', time: '9:30am-5:30pm' },
        { name: 'Jordan Berta', role: 'Team Leader', time: '8:00am-4:00pm' },
        { name: 'Delani Chinnappah', role: '', time: '8:00am-4:00pm' }
    ];
    weekData.wednesday.shifts[2].staff = [
        { name: 'Carol Gray', role: 'Team Leader', time: '2pm-10pm' },
        { name: 'Valerie Masinzo', role: '', time: '4pm-12am' },
        { name: 'Elizabeth Danna', role: 'V.M. Requests + Calls', time: '4pm-12am' },
        { name: 'Gloria Rankin', role: '', time: '4pm-12am' },
        { name: 'Joyce Frederick', role: '', time: '4pm-12am' }
    ];
    
    // Thursday initial data
    weekData.thursday.shifts[0].staff = [
        { name: 'Pat Bailey', role: 'Team Leader', time: '12am-8am' },
        { name: 'Leonard Hutchinson', role: '', time: '12am-8am' },
        { name: 'David Piper', role: '', time: '12am-8am' },
        { name: 'Richard Helmer', role: '', time: '12am-8am' },
        { name: 'Danette Bloomfield', role: '', time: '12am-8am' },
        { name: 'Carmen Quesada', role: '', time: '12am-8am' }
    ];
    weekData.thursday.shifts[1].staff = [
        { name: 'Gloria Willoughby', role: '', time: '9:30am-5:30pm' },
        { name: 'Sharon L.-Arndt', role: '', time: '9:30am-5:30pm' },
        { name: 'Jordan Berta', role: 'Team Leader', time: '8:00am-4:00pm' },
        { name: 'Penny Spence', role: 'Back-up Team Leader', time: '8:00am-4:00pm' }
    ];
    weekData.thursday.shifts[2].staff = [
        { name: 'Carol Gray', role: 'Team Leader', time: '2pm-10pm' },
        { name: 'Lois Walker', role: '', time: '4pm-12am' },
        { name: 'Gloria Rankin', role: '', time: '4:00pm-12:00am' },
        { name: 'Elizabeth Danna', role: 'VM Requests + calls', time: '4:00pm-12:00am' },
        { name: 'Coral Jones', role: '', time: '4:00pm-12:00am' }
    ];
    
    // Friday initial data
    weekData.friday.shifts[0].staff = [
        { name: 'Pat Bailey', role: 'Team Leader', time: '12am-8am' },
        { name: 'Leonard Hutchinson', role: '', time: '12am-8am' },
        { name: 'David Piper', role: '', time: '12am-8am' },
        { name: 'Richard Helmer', role: '', time: '12am-8am' },
        { name: 'Danette Bloomfield', role: '', time: '12am-8am' },
        { name: 'Carmen Quesada', role: '', time: '12am-8am' }
    ];
    weekData.friday.shifts[1].staff = [
        { name: 'Gloria Willoughby', role: '', time: '9:30am-5:30pm' },
        { name: 'Sharon L-Arndt', role: '', time: '9:30am-5:30pm' },
        { name: 'Jordan Berta', role: 'Team Leader', time: '8:00am-4:00pm' },
        { name: 'Anne Gwaza', role: 'Prayer emails', time: '8:00am-12pm' },
        { name: 'Penny Spence', role: 'Back-up Team Leader', time: '8:00am-4:00pm' }
    ];
    weekData.friday.shifts[2].staff = [
        { name: 'Carol Gray', role: 'Team Leader', time: '2pm-10pm' },
        { name: 'Elizabeth Danna', role: '', time: '4pm-12am' },
        { name: 'Lois Walker', role: '', time: '4pm-12am' },
        { name: 'Benjamin Paul', role: '', time: '4pm-12am' },
        { name: 'Coral Jones', role: 'VM Requests +calls', time: '4pm-12am' },
        { name: 'Gloria Rankin', role: 'Works e/o week', time: '4:00pm-12:00am' }
    ];
    
    // Saturday initial data
    weekData.saturday.shifts[0].staff = [
        { name: 'Pat Bailey', role: 'Team Leader', time: '12am-8am' },
        { name: 'Richard Helmer', role: '', time: '12am-8am' },
        { name: 'Jennifer Isaiah-Lawal', role: '', time: '12am-8am' },
        { name: 'Dawn Sears', role: '', time: '12am-8am' },
        { name: 'Carmen Quesada', role: '', time: '12am-8am' },
        { name: 'John Rhee', role: '', time: '12am-8am' }
    ];
    weekData.saturday.shifts[1].staff = [
        { name: 'Penny Spence', role: 'Team Leader', time: '8:00am-4:00pm' },
        { name: 'Delani Chinnippah', role: '', time: '8:00am-4:00pm' },
        { name: 'Marilyn Khasnabish', role: '', time: '8:00am-4:00pm' },
        { name: 'Cathy Bard', role: '', time: '8:00am-4:00pm' },
        { name: 'Ruth Stockdale', role: '', time: '8:00am-4:00pm' }
    ];
    weekData.saturday.shifts[2].time = '4:00pm-12:00am';
    weekData.saturday.shifts[2].staff = [
        { name: 'Valerie Masinzo', role: 'Team Leader', time: '4:00pm-12:00am' },
        { name: 'Lois Walker', role: '', time: '4:00pm-12:00pm' },
        { name: 'Elizabeth Danna', role: 'VM Requests +calls', time: '4:00pm-12:00pm' },
        { name: 'Coral Jones', role: '', time: '4:00pm-12:00am' },
        { name: 'Katie Meilleur', role: '', time: '4:00pm-12:00am' },
        { name: 'Chris O\'Connor', role: 'Works: e/o Saturday', time: '4:00pm-12:00am' },
        { name: 'Benjamin Paul', role: 'Works: e/o alternate Saturday', time: '4:00pm-12:00am' }
    ];
    
    saveToStorage();
}

// API Functions - Save/Load from server
async function saveToStorage() {
    try {
        console.log('💾 Saving data to server...', { staffCount: appState.staff?.length, weeksCount: Object.keys(appState.weeks || {}).length });
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(appState)
        });
        
        console.log('📡 Save response status:', response.status, response.statusText);
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Unauthorized - session expired');
                // Unauthorized - redirect to login
                if (typeof logout === 'function') {
                    logout();
                }
                return false;
            }
            console.error('❌ Error saving data:', result.error);
            alert('Error saving data: ' + (result.error || 'Unknown error'));
            return false;
        }
        console.log('✅ Data saved successfully');
        return true;
    } catch (e) {
        console.error('❌ Error saving to server:', e);
        alert('Error saving data. Please check the console for details.');
        // Fallback to localStorage if server is unavailable
        try {
            localStorage.setItem('pcStaffData', JSON.stringify(appState));
            console.log('⚠️ Saved to localStorage as fallback');
        } catch (localError) {
            console.error('Error saving to localStorage:', localError);
        }
        return false;
    }
}

// Default staff list from original document
const DEFAULT_STAFF = [
    'Pat Bailey', 'Richard Helmer', 'Dawn Sears', 'Jennifer Isaiah-Lawal',
    'Carmen Quesada', 'John Rhee', 'David Piper', 'Danette Bloomfield',
    'Leonard Hutchinson', 'Gloria Rankin', 'Penny Spence', 'Ruth Stockdale',
    'Joyce Frederick', 'Marilyn Khasnabish', 'Cathy Bard', 'Delani Chinnappah',
    'Valerie Masinzo', 'Lois Walker', 'Coral Jones', 'Benjamin Paul',
    'Chris O\'Connor', 'Katie Meilleur', 'Gloria Willoughby', 'Jordan Berta',
    'Sharon L-Arndt', 'Anne Gwaza', 'Carol Gray', 'Elizabeth Danna'
];

async function loadFromStorage() {
    try {
        console.log('📥 Loading data from server...');
        const response = await fetch('/api/data', {
            credentials: 'include'
        });
        
        console.log('📡 Load response status:', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Unauthorized - not logged in');
                // Unauthorized - redirect to login
                if (typeof logout === 'function') {
                    logout();
                }
                return false;
            }
            console.error('❌ Failed to fetch data:', response.status, response.statusText);
            throw new Error('Failed to fetch data: ' + response.statusText);
        }
        const data = await response.json();
        console.log('✅ Data loaded:', { staffCount: data.staff?.length, weeksCount: Object.keys(data.weeks || {}).length });
        // Migrate old data structure if needed
        if (data && data.days && !data.weeks) {
            // Old structure - migrate to week-based
            const currentWeek = getWeekString(new Date());
            data.weeks = {};
            data.weeks[currentWeek] = data.days;
            data.currentWeek = currentWeek;
            delete data.days;
            if (typeof data.additionalNotes === 'string') {
                const notes = data.additionalNotes;
                data.additionalNotes = {};
                data.additionalNotes[currentWeek] = notes;
            }
        }
        if (data) {
            console.log('📦 Assigning data to appState...', {
                staffCount: data.staff?.length,
                weeksCount: Object.keys(data.weeks || {}).length,
                currentWeek: data.currentWeek
            });
            Object.assign(appState, data);
            // Initialize staffProfiles if it doesn't exist
            if (!appState.staffProfiles) {
                appState.staffProfiles = {};
            }
            // Always ensure default staff are present (merge with existing)
            if (!appState.staff || appState.staff.length === 0) {
                console.log('⚠️ No staff in data, using defaults');
                appState.staff = [...DEFAULT_STAFF];
            } else {
                console.log('✅ Staff found in data:', appState.staff.length, 'members');
                // Merge default staff with existing, avoiding duplicates
                DEFAULT_STAFF.forEach(staff => {
                    if (!appState.staff.includes(staff)) {
                        appState.staff.push(staff);
                    }
                });
                // Sort staff alphabetically
                appState.staff.sort();
            }
            // Initialize current week if needed
            if (!appState.currentWeek) {
                appState.currentWeek = getWeekString(new Date());
                console.log('📅 Set current week to:', appState.currentWeek);
            }
            const weekData = getCurrentWeekData();
            console.log('📊 Current week data:', {
                hasSunday: !!weekData.sunday,
                sundayShifts: weekData.sunday?.shifts?.length || 0
            });
            initializeShifts(weekData);
            console.log('✅ Data loading complete, appState:', {
                staffCount: appState.staff?.length,
                currentWeek: appState.currentWeek,
                weeksCount: Object.keys(appState.weeks || {}).length
            });
            return true; // Data loaded
        }
    } catch (e) {
        console.error('Error loading from server:', e);
        // Fallback to localStorage if server is unavailable
        try {
            const saved = localStorage.getItem('pcStaffData');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.staff) {
                    // Migrate old structure if needed
                    if (parsed.days && !parsed.weeks) {
                        const currentWeek = getWeekString(new Date());
                        parsed.weeks = {};
                        parsed.weeks[currentWeek] = parsed.days;
                        parsed.currentWeek = currentWeek;
                        delete parsed.days;
                        if (typeof parsed.additionalNotes === 'string') {
                            const notes = parsed.additionalNotes;
                            parsed.additionalNotes = {};
                            parsed.additionalNotes[currentWeek] = notes;
                        }
                    }
                    Object.assign(appState, parsed);
                    if (!appState.currentWeek) {
                        appState.currentWeek = getWeekString(new Date());
                    }
                    const weekData = getCurrentWeekData();
                    initializeShifts(weekData);
                    return true;
                }
            }
        } catch (localError) {
            console.error('Error loading from localStorage:', localError);
        }
    }
    return false; // No data loaded
}

// Staff Management
function addStaff(name) {
    if (!name || name.trim() === '') return;
    const trimmedName = name.trim();
    if (!appState.staff.includes(trimmedName)) {
        appState.staff.push(trimmedName);
        saveToStorage();
        renderStaffList();
        renderAllDays();
    }
}

function removeStaff(name) {
    appState.staff = appState.staff.filter(s => s !== name);
    // Remove from all shifts in all weeks
    Object.keys(appState.weeks).forEach(week => {
        Object.keys(appState.weeks[week]).forEach(day => {
            appState.weeks[week][day].shifts.forEach(shift => {
                shift.staff = shift.staff.filter(s => s.name !== name);
            });
        });
    });
    saveToStorage();
    renderStaffList();
    renderAllDays();
}

function renderStaffList() {
    const staffList = document.getElementById('staff-list');
    if (!staffList) {
        console.error('❌ staff-list element not found!');
        return;
    }
    staffList.innerHTML = '';
    
    console.log('👥 Rendering staff list with', appState.staff?.length || 0, 'staff members');
    
    if (!appState.staff || appState.staff.length === 0) {
        console.warn('⚠️ No staff to render!');
        return;
    }
    
    appState.staff.forEach(staff => {
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        // Escape quotes in staff name for onclick
        const escapedStaff = staff.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        staffItem.innerHTML = `
            <span>${staff}</span>
            <button class="edit-staff-btn" onclick="openStaffProfile('${escapedStaff}')" title="Edit Profile">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="remove-staff" onclick="removeStaff('${escapedStaff}')">×</button>
        `;
        staffList.appendChild(staffItem);
    });
}

// Day/Shift Management
function addStaffToShift(day, shiftIndex) {
    const days = getCurrentDays();
    const shift = days[day].shifts[shiftIndex];
    shift.staff.push({
        name: '',
        role: '',
        time: shift.time
    });
    saveToStorage();
    renderDay(day);
}

function removeStaffFromShift(day, shiftIndex, staffIndex) {
    const days = getCurrentDays();
    days[day].shifts[shiftIndex].staff.splice(staffIndex, 1);
    saveToStorage();
    renderDay(day);
}

function updateStaffInShift(day, shiftIndex, staffIndex, field, value) {
    const days = getCurrentDays();
    const staff = days[day].shifts[shiftIndex].staff[staffIndex];
    staff[field] = value;
    saveToStorage();
}

function updateShiftTime(day, shiftIndex, time) {
    const days = getCurrentDays();
    days[day].shifts[shiftIndex].time = time;
    // Update all staff times if they match the old time
    const shift = days[day].shifts[shiftIndex];
    shift.staff.forEach(s => {
        if (s.time === shift.time || !s.time) {
            s.time = time;
        }
    });
    saveToStorage();
    renderDay(day);
}

function updateSpecialInstructions(day, shiftIndex, instructions) {
    const days = getCurrentDays();
    days[day].shifts[shiftIndex].specialInstructions = instructions;
    saveToStorage();
}

function updateDate(day, date) {
    const days = getCurrentDays();
    days[day].date = date;
    saveToStorage();
}

function updateAdditionalNotes(notes) {
    if (!appState.additionalNotes[appState.currentWeek]) {
        appState.additionalNotes[appState.currentWeek] = '';
    }
    appState.additionalNotes[appState.currentWeek] = notes;
    saveToStorage();
}

// Rendering
function renderDay(day) {
    const dayView = document.getElementById(`day-view-${day}`);
    if (!dayView) return;
    
    const days = getCurrentDays();
    const dayData = days[day];
    const currentYear = new Date().getFullYear();
    
    dayView.innerHTML = `
        <div class="day-header">
            <h2>${day.charAt(0).toUpperCase() + day.slice(1)} Team Leader Report</h2>
            <input type="date" 
                   class="date-input" 
                   value="${dayData.date || ''}" 
                   onchange="updateDate('${day}', this.value)"
                   placeholder="Select date">
        </div>
        ${dayData.shifts.map((shift, shiftIndex) => `
            <div class="shift-section">
                <div class="shift-header">
                    <h3>${shift.name} Shift</h3>
                    <input type="text" 
                           class="shift-time-input" 
                           value="${shift.time}" 
                           onchange="updateShiftTime('${day}', ${shiftIndex}, this.value)"
                           placeholder="Shift time">
                </div>
                <div class="staff-list-shift">
                    ${shift.staff.map((staffEntry, staffIndex) => `
                        <div class="staff-entry">
                            <select class="staff-select" 
                                    onchange="updateStaffInShift('${day}', ${shiftIndex}, ${staffIndex}, 'name', this.value)">
                                <option value="">Select staff...</option>
                                ${appState.staff.map(staff => `
                                    <option value="${staff}" ${staff === staffEntry.name ? 'selected' : ''}>${staff}</option>
                                `).join('')}
                            </select>
                            <input type="text" 
                                   class="role-input" 
                                   value="${staffEntry.role || ''}" 
                                   placeholder="Role (e.g., Team Leader)"
                                   onchange="updateStaffInShift('${day}', ${shiftIndex}, ${staffIndex}, 'role', this.value)">
                            <input type="text" 
                                   class="time-input" 
                                   value="${staffEntry.time || shift.time}" 
                                   placeholder="Time"
                                   onchange="updateStaffInShift('${day}', ${shiftIndex}, ${staffIndex}, 'time', this.value)">
                            <button class="btn-remove" onclick="removeStaffFromShift('${day}', ${shiftIndex}, ${staffIndex})">Remove</button>
                        </div>
                    `).join('')}
                    <button class="btn-add" onclick="addStaffToShift('${day}', ${shiftIndex})">+ Add Staff Member</button>
                </div>
                <div class="special-instructions">
                    <label>Special Instructions:</label>
                    <textarea 
                        placeholder="Anything out of the ordinary, such as: times computers were down or fire alarms, observations or unique shift occurrences. Also, list those sick, additional staff replacements, on vacation etc."
                        oninput="updateSpecialInstructions('${day}', ${shiftIndex}, this.value)">${shift.specialInstructions || ''}</textarea>
                </div>
            </div>
        `).join('')}
    `;
}

function renderAllDays() {
    const days = getCurrentDays();
    Object.keys(days).forEach(day => {
        renderDay(day);
    });
}

function renderDayViews() {
    const dayViews = document.getElementById('day-views');
    dayViews.innerHTML = '';
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayNames.forEach(day => {
        const dayView = document.createElement('div');
        dayView.id = `day-view-${day}`;
        dayView.className = 'day-view hidden';
        dayViews.appendChild(dayView);
    });
    
    renderAllDays();
}

// Week switching functions
function switchWeek(weekString) {
    // Save current week data before switching
    saveToStorage();
    
    // Set new week
    appState.currentWeek = weekString;
    
    // Get or create week data
    const weekData = getCurrentWeekData();
    
    // Initialize if empty
    if (!weekData.sunday.shifts || weekData.sunday.shifts.length === 0) {
        initializeShifts(weekData);
        // If this is the first time, initialize with original data
        if (Object.keys(appState.weeks).length === 1) {
            initializeWithOriginalData(weekData);
        }
    } else {
        initializeShifts(weekData);
    }
    
    // Update week picker
    updateWeekPicker();
    
    // Re-render everything
    renderAllDays();
    
    // Update notes
    const notesTextarea = document.getElementById('additional-notes');
    notesTextarea.value = appState.additionalNotes[appState.currentWeek] || '';
}

function updateWeekPicker() {
    const weekPicker = document.getElementById('week-picker');
    if (weekPicker && appState.currentWeek) {
        // Convert week string to HTML5 week input format: YYYY-Www
        // Our format is already YYYY-Www, so we can use it directly
        weekPicker.value = appState.currentWeek;
    }
}

function getWeekFromWeekInput(weekInput) {
    // Week input format: YYYY-Www (already matches our format)
    return weekInput;
}

function navigateWeek(direction) {
    const currentWeek = appState.currentWeek || getWeekString(new Date());
    const sunday = getSundayFromWeek(currentWeek);
    // Add or subtract 7 days
    sunday.setDate(sunday.getDate() + (direction * 7));
    const newWeekString = getWeekString(sunday);
    switchWeek(newWeekString);
}

function showDay(day) {
    // Hide all day views
    document.querySelectorAll('.day-view').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Hide notes view
    document.getElementById('notes-view').classList.add('hidden');
    
    // Show selected view
    if (day === 'notes') {
        document.getElementById('notes-view').classList.remove('hidden');
    } else {
        const dayView = document.getElementById(`day-view-${day}`);
        if (dayView) {
            dayView.classList.remove('hidden');
        }
    }
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-day="${day}"]`).classList.add('active');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for authentication check before initializing app
    // This will be handled by auth.js, but we need to ensure app only loads when authenticated
    if (typeof checkAuth === 'function') {
        const authenticated = await checkAuth();
        if (!authenticated) {
            return; // Don't initialize app if not authenticated
        }
    }
    
    // Initialize current week if not set
    if (!appState.currentWeek) {
        appState.currentWeek = getWeekString(new Date());
    }
    
    // Load from storage - if no data, initialize with original document data
    const dataLoaded = await loadFromStorage();
    
    // Ensure default staff are always present
    if (!appState.staff || appState.staff.length === 0) {
        appState.staff = [...DEFAULT_STAFF];
    } else {
        // Merge default staff with existing, avoiding duplicates
        DEFAULT_STAFF.forEach(staff => {
            if (!appState.staff.includes(staff)) {
                appState.staff.push(staff);
            }
        });
        // Sort staff alphabetically
        appState.staff.sort();
    }
    
    // Save updated staff list if we added any
    saveToStorage();
    
    // Get or initialize current week data
    const weekData = getCurrentWeekData();
    if (!dataLoaded || !weekData.sunday.shifts || weekData.sunday.shifts.length === 0) {
        // Initialize with original data template
        initializeWithOriginalData(weekData);
    } else {
        // Ensure shifts are initialized
        initializeShifts(weekData);
    }
    
    // Set dates for current week if not set
    const today = new Date();
    const sunday = getWeekStartDate(today);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayNames.forEach((day, index) => {
        if (!weekData[day].date) {
            const dayDate = new Date(sunday);
            dayDate.setDate(sunday.getDate() + index);
            weekData[day].date = dayDate.toISOString().split('T')[0];
        }
    });
    
    saveToStorage();
    
    console.log('🎨 Rendering UI...', {
        staffCount: appState.staff?.length,
        currentWeek: appState.currentWeek
    });
    renderStaffList();
    renderDayViews();
    updateWeekPicker();
    console.log('✅ UI rendering complete');
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            showDay(day);
        });
    });
    
    // Add staff
    document.getElementById('add-staff-btn').addEventListener('click', () => {
        const input = document.getElementById('new-staff-name');
        addStaff(input.value);
        input.value = '';
    });
    
    document.getElementById('new-staff-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = document.getElementById('new-staff-name');
            addStaff(input.value);
            input.value = '';
        }
    });
    
    // Week picker
    const weekPicker = document.getElementById('week-picker');
    weekPicker.addEventListener('change', (e) => {
        const weekString = getWeekFromWeekInput(e.target.value);
        switchWeek(weekString);
    });
    
    // Week navigation buttons
    document.getElementById('prev-week-btn').addEventListener('click', () => {
        navigateWeek(-1);
    });
    
    document.getElementById('next-week-btn').addEventListener('click', () => {
        navigateWeek(1);
    });
    
    // Additional notes
    const notesTextarea = document.getElementById('additional-notes');
    notesTextarea.value = appState.additionalNotes[appState.currentWeek] || '';
    notesTextarea.addEventListener('input', () => {
        updateAdditionalNotes(notesTextarea.value);
    });
    
    // Show Sunday by default
    showDay('sunday');
    
    // Close staff profile modal when clicking outside of it
    const staffModal = document.getElementById('staff-profile-modal');
    if (staffModal) {
        staffModal.addEventListener('click', (e) => {
            if (e.target === staffModal) {
                closeStaffProfile();
            }
        });
    }
});

// Reset to original data
async function resetToOriginal() {
    if (confirm('Reset current week to original schedule? This will clear all current week\'s data.')) {
        try {
            // Ensure current week exists in appState.weeks
            if (!appState.weeks) {
                appState.weeks = {};
            }
            if (!appState.weeks[appState.currentWeek]) {
                appState.weeks[appState.currentWeek] = {
                    sunday: { date: '', shifts: [] },
                    monday: { date: '', shifts: [] },
                    tuesday: { date: '', shifts: [] },
                    wednesday: { date: '', shifts: [] },
                    thursday: { date: '', shifts: [] },
                    friday: { date: '', shifts: [] },
                    saturday: { date: '', shifts: [] }
                };
            }
            
            // Reset current week only
            const weekData = getCurrentWeekData();
            // Clear and reinitialize
            Object.keys(weekData).forEach(day => {
                weekData[day] = { date: '', shifts: [] };
            });
            initializeShifts(weekData);
            initializeWithOriginalData(weekData);
            saveToStorage();
            renderAllDays();
        } catch (error) {
            console.error('Error resetting data:', error);
            alert('Error resetting data: ' + error.message + '. Please check the console for details.');
        }
    }
}

// Staff Profile Management
function openStaffProfile(staffName) {
    const modal = document.getElementById('staff-profile-modal');
    const profile = appState.staffProfiles[staffName] || {};
    
    // Set the original staff name (for lookup)
    document.getElementById('profile-staff-name').value = staffName;
    
    // Populate form fields
    document.getElementById('profile-name').value = profile.name || staffName;
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-phone').value = profile.phone || '';
    document.getElementById('profile-address').value = profile.address || '';
    document.getElementById('profile-notes').value = profile.notes || '';
    
    // Clear and set preferred shifts checkboxes
    const checkboxes = document.querySelectorAll('input[name="preferredShifts"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    if (profile.preferredShifts && Array.isArray(profile.preferredShifts)) {
        profile.preferredShifts.forEach(shift => {
            const checkbox = document.querySelector(`input[name="preferredShifts"][value="${shift}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    modal.classList.remove('hidden');
}

function closeStaffProfile() {
    const modal = document.getElementById('staff-profile-modal');
    modal.classList.add('hidden');
    // Reset form
    document.getElementById('staff-profile-form').reset();
}


function saveStaffProfile(event) {
    event.preventDefault();
    
    const originalName = document.getElementById('profile-staff-name').value;
    const formData = new FormData(event.target);
    
    // Get all checked preferred shifts
    const preferredShifts = [];
    document.querySelectorAll('input[name="preferredShifts"]:checked').forEach(cb => {
        preferredShifts.push(cb.value);
    });
    
    // Build profile object
    const profile = {
        name: formData.get('name') || originalName,
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        address: formData.get('address') || '',
        notes: formData.get('notes') || '',
        preferredShifts: preferredShifts
    };
    
    // If name changed, update the staff list
    const newName = profile.name;
    if (newName !== originalName && newName.trim()) {
        // Remove old name from staff list
        const oldIndex = appState.staff.indexOf(originalName);
        if (oldIndex !== -1) {
            appState.staff[oldIndex] = newName;
            // Move profile data to new name
            if (appState.staffProfiles[originalName]) {
                appState.staffProfiles[newName] = appState.staffProfiles[originalName];
                delete appState.staffProfiles[originalName];
            }
            // Sort staff list
            appState.staff.sort();
        }
    }
    
    // Save profile under the (possibly new) name
    appState.staffProfiles[newName] = profile;
    
    // Save to storage
    saveToStorage();
    
    // Re-render staff list in case name changed
    renderStaffList();
    
    // Close modal
    closeStaffProfile();
    
    // Show success message
    alert('Staff profile saved successfully!');
}

// Make functions globally available
window.addStaff = addStaff;
window.removeStaff = removeStaff;
window.openStaffProfile = openStaffProfile;
window.closeStaffProfile = closeStaffProfile;
window.saveStaffProfile = saveStaffProfile;
window.addStaffToShift = addStaffToShift;
window.removeStaffFromShift = removeStaffFromShift;
window.updateStaffInShift = updateStaffInShift;
window.updateShiftTime = updateShiftTime;
window.updateSpecialInstructions = updateSpecialInstructions;
window.updateDate = updateDate;
window.updateAdditionalNotes = updateAdditionalNotes;
window.resetToOriginal = resetToOriginal;

