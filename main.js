// Global variables
let rowCount = 0;
const MAX_ROWS = 15; // Maximum allowed rows
let currentResults = null;
let editingResultId = null;
let customSubjectNames = {};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the table with default 5 rows
    const tableBody = document.getElementById('tableBody');

    // Add initial 5 rows
    for (let i = 0; i < 5; i++) {
        addNewRow();
    }

    // Add row button functionality
    document.getElementById('addRowBtn').addEventListener('click', function() {
        if (rowCount < MAX_ROWS) {
            addNewRow();
            updateRowCounter();
        } else {
            showError(`Maximum ${MAX_ROWS} subjects allowed!`);
        }
    });

    // Reset button functionality
    document.getElementById('reset').addEventListener('click', function() {
        resetForm();
    });

    // User action buttons
    document.getElementById('historyBtn').addEventListener('click', showHistoryModal);

    // Add event listeners for the close buttons (X) in modals
    document.getElementById('closeSaveModal').addEventListener('click', closeSaveModal);
    document.getElementById('closeHistoryModal').addEventListener('click', closeHistoryModal);
    document.getElementById('closeViewResultModal').addEventListener('click', closeViewResultModal);
    document.getElementById('closeEditSubjectsModal').addEventListener('click', closeEditSubjectsModal);

    // Save result buttons
    document.getElementById('saveResultBtn').addEventListener('click', showSaveModal);
    document.getElementById('cancelSave').addEventListener('click', closeSaveModal);
    document.getElementById('confirmSave').addEventListener('click', saveResult);

    // Download button
    document.getElementById('downloadResultBtn').addEventListener('click', downloadResult);
    document.getElementById('downloadDetail').addEventListener('click', downloadDetailResult);

    // Detail view button
    document.getElementById('closeDetailView').addEventListener('click', closeViewResultModal);

    // Subject names buttons
    document.getElementById('cancelEditSubjects').addEventListener('click', closeEditSubjectsModal);
    document.getElementById('saveSubjectNames').addEventListener('click', saveSubjectNamesChanges);

    // Initialize AOS (Animate on Scroll) with a small delay to ensure content is visible first
    try {
        setTimeout(() => {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,
                    easing: 'ease-in-out',
                    once: true,
                    mirror: false,
                    disable: 'mobile' // Disable on mobile for better performance
                });
            } else {
                console.warn('AOS library not loaded, animations disabled');
                // Remove AOS attributes to ensure content is visible
                document.querySelectorAll('[data-aos]').forEach(el => {
                    el.removeAttribute('data-aos');
                    el.removeAttribute('data-aos-delay');
                    el.removeAttribute('data-aos-duration');
                });
            }
        }, 100);
    } catch (error) {
        console.error('Error initializing AOS:', error);
    }

    // Fallback to ensure content is visible after 1 second
    setTimeout(() => {
        document.querySelectorAll('[data-aos]').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }, 1000);

    // Initialize new features
    initScrollProgress();
    initBackToTop();
    initThemeToggle();

    // Add navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Create folder structure when app loads
    createFolderStructure();

    // Add an export data button to the history modal
    const historyModal = document.querySelector('#historyModal .modal');
    if (historyModal) {
        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.className = 'btn-export';
        exportButton.innerHTML = '<i class="fas fa-file-export"></i> Export All Data';
        exportButton.addEventListener('click', exportDataToCSV);

        // Find a good place to add it, e.g., after the title
        const title = historyModal.querySelector('h2');
        if (title) {
            title.insertAdjacentElement('afterend', exportButton);
        }

        // Add style for the export button
        document.head.insertAdjacentHTML('beforeend', `
        <style>
        .btn-export {
            background: linear-gradient(135deg, #34495e, #2c3e50);
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 50px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 auto 1.5rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .btn-export:hover {
            background: linear-gradient(135deg, #2c3e50, #1a2530);
            transform: translateY(-3px);
        }
        </style>
        `);
    }

    // Add click outside to close functionality for all modals
    const modalContainers = document.querySelectorAll('.modal-container');
    modalContainers.forEach(container => {
        container.addEventListener('click', function(event) {
            // Only close if the click is directly on the modal-container, not on its children
            if (event.target === container) {
                // Get the modal ID and close it accordingly
                const modalId = container.id;
                if (modalId === 'saveModal') closeSaveModal();
                else if (modalId === 'historyModal') closeHistoryModal();
                else if (modalId === 'viewResultModal') closeViewResultModal();
                else if (modalId === 'editSubjectsModal') closeEditSubjectsModal();
            }
        });
    });
});

function checkLoginStatus() {
    // Check if user data exists in localStorage
    const userData = localStorage.getItem('sgpaUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUIForLoggedInUser();
    }
}

function updateUIForLoggedInUser() {
    if (currentUser) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-flex';
        document.getElementById('historyBtn').style.display = 'inline-flex';

        // Pre-fill student info if available
        if (currentUser.name) {
            document.getElementById('studentName').value = currentUser.name;
        }
        if (currentUser.usn) {
            document.getElementById('usn').value = currentUser.usn;
        }
    } else {
        document.getElementById('loginBtn').style.display = 'inline-flex';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('historyBtn').style.display = 'none';
    }
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    // Default to login tab
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
    // Clear any inputs
    document.getElementById('loginUSN').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regName').value = '';
    document.getElementById('regUSN').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regConfirmPassword').value = '';
}

function switchAuthTab(tabType) {
    // Update tab classes
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Show appropriate content
    if (tabType === 'login') {
        document.getElementById('loginTab').style.display = 'block';
        document.getElementById('registerTab').style.display = 'none';
    } else {
        document.getElementById('loginTab').style.display = 'none';
        document.getElementById('registerTab').style.display = 'block';
    }
}

function loginUser() {
    const usn = document.getElementById('loginUSN').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!usn || !password) {
        alert('Please enter both USN and password.');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('sgpaUsers') || '[]');
    const user = users.find(u => u.usn.toLowerCase() === usn.toLowerCase() && u.password === password);

    if (user) {
        currentUser = {
            id: user.id,
            name: user.name,
            usn: user.usn
        };

        // Store current user in localStorage
        localStorage.setItem('sgpaUser', JSON.stringify(currentUser));

        updateUIForLoggedInUser();
        closeAuthModal();
    } else {
        alert('Invalid USN or password. Please try again.');
    }
}

function registerUser() {
    console.log("Register function called");

    // Get form fields
    const regName = document.getElementById('regName');
    const regUSN = document.getElementById('regUSN');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');

    if (!regName || !regUSN || !regPassword || !regConfirmPassword) {
        console.error('Register input fields not found');
        alert('Registration form error. Please refresh the page.');
        return;
    }

    // Get values
    const name = regName.value.trim();
    const usn = regUSN.value.trim();
    const password = regPassword.value.trim();
    const confirmPassword = regConfirmPassword.value.trim();

    // Log inputs for debugging
    console.log("Register inputs:", { name, usn, password_length: password.length, confirmPassword_length: confirmPassword.length });

    // Validate inputs
    if (!name || !usn || !password || !confirmPassword) {
        // Highlight empty fields
        if (!name) regName.style.borderColor = '#ff6b6b';
        if (!usn) regUSN.style.borderColor = '#ff6b6b';
        if (!password) regPassword.style.borderColor = '#ff6b6b';
        if (!confirmPassword) regConfirmPassword.style.borderColor = '#ff6b6b';

        alert('Please fill in all fields.');

        // Reset highlights after delay
        setTimeout(() => {
            regName.style.borderColor = '';
            regUSN.style.borderColor = '';
            regPassword.style.borderColor = '';
            regConfirmPassword.style.borderColor = '';
        }, 3000);
        return;
    }

    // Check password match
    if (password !== confirmPassword) {
        regPassword.style.borderColor = '#ff6b6b';
        regConfirmPassword.style.borderColor = '#ff6b6b';

        alert('Passwords do not match.');

        setTimeout(() => {
            regPassword.style.borderColor = '';
            regConfirmPassword.style.borderColor = '';
        }, 3000);
        return;
    }

    // Get existing users with error handling
    let users = [];
    try {
        // First check if localStorage is available
        if (typeof localStorage === 'undefined') {
            throw new Error('localStorage is not available');
        }

        const existingUsers = localStorage.getItem('sgpaUsers');
        console.log("Existing users string:", existingUsers);

        if (existingUsers) {
            users = JSON.parse(existingUsers);
            console.log("Parsed users:", users);

            // Validate it's an array
            if (!Array.isArray(users)) {
                console.warn('Stored users is not an array, resetting to empty array');
                users = [];
                localStorage.setItem('sgpaUsers', '[]');
            }
        } else {
            // Initialize if not exists
            localStorage.setItem('sgpaUsers', '[]');
        }
    } catch (error) {
        console.error('Error accessing or parsing localStorage:', error);
        users = [];

        // Try to reset storage
        try {
            localStorage.setItem('sgpaUsers', '[]');
        } catch (storageError) {
            console.error('Failed to reset storage:', storageError);
            alert('Browser storage error. Please check your privacy settings or try a different browser.');
            return;
        }
    }

    // Check for duplicate USN
    const existingUser = users.find(u => u.usn && u.usn.toLowerCase() === usn.toLowerCase());
    if (existingUser) {
        console.log('Duplicate USN found:', usn);
        regUSN.style.borderColor = '#ff6b6b';
        alert('A user with this USN already exists.');
        setTimeout(() => {
            regUSN.style.borderColor = '';
        }, 3000);
        return;
    }

    // Create new user
    const newUserId = generateId();
    const newUser = {
        id: newUserId,
        name,
        usn,
        password,
        results: []
    };

    console.log('New user:', newUser);

    // Add to users array
    users.push(newUser);

    try {
        // Save to localStorage with quota handling
        const usersJson = JSON.stringify(users);
        console.log("Saving users JSON (length):", usersJson.length);

        try {
            localStorage.setItem('sgpaUsers', usersJson);
        } catch (storageError) {
            console.error('Error saving to localStorage:', storageError);

            if (storageError.name === 'QuotaExceededError' ||
                storageError.toString().includes('quota') ||
                storageError.toString().includes('storage')) {

                alert('Storage limit reached. Please clear browser data or use the debug function to reset storage.');
                return;
            } else {
                throw storageError; // Re-throw for the outer catch
            }
        }

        // Verify data was saved
        const savedData = localStorage.getItem('sgpaUsers');
        if (!savedData) {
            throw new Error('Data not saved - storage may be disabled');
        }
        console.log('Data saved successfully, bytes:', savedData.length);

        // Set as current user (without password)
        currentUser = {
            id: newUserId,
            name: newUser.name,
            usn: newUser.usn
        };

        // Save current user
        localStorage.setItem('sgpaUser', JSON.stringify(currentUser));

        console.log('User registered successfully:', newUser.id);

        // Update UI and close modal
        updateUIForLoggedInUser();
        closeAuthModal();
        alert('Account created successfully! You are now logged in.');
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Error creating account: ' + error.message);
    }
}

function logoutUser() {
    // Clear current user
    currentUser = null;
    localStorage.removeItem('sgpaUser');

    // Update UI
    updateUIForLoggedInUser();

    // Reset form fields if needed
    document.getElementById('studentName').value = '';
    document.getElementById('usn').value = '';
}

function resetForm() {
    // Reset all input fields
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        if (input.id !== 'studentName' && input.id !== 'usn' && input.id !== 'gradYear') {
            input.value = '';
        }
    });

    // Reset semester dropdown
    document.getElementById('semester').value = '';

    // Reset result displays
    document.getElementById('result').innerText = 'Your SGPA will appear here';
    document.getElementById('percentage').innerText = 'Your percentage will appear here';
    document.getElementById('result').style.color = '';
    document.getElementById('percentage').style.color = '';
    document.getElementById('gradeDisplay').style.display = 'none';

    // Reset subject names
    customSubjectNames = {};

    // Hide result container by removing the 'show' class
    document.getElementById('resultContainer').classList.remove('show');
}

function addNewRow() {
    rowCount++;
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    newRow.classList.add('row-inserting');
    newRow.setAttribute('data-row', rowCount);

    // Create the row with appropriate IDs for the inputs
    newRow.innerHTML = `
        <th class="subject-name">Subject ${rowCount}</th>
        <td><input type="number" id="credit${rowCount}" class="credit-input" placeholder="Credit" min="1" max="10"></td>
        <td><input type="number" id="marks${rowCount}" class="marks-input" placeholder="Marks" min="0" max="100"></td>
        <td>
            ${rowCount > 1 ?
              `<button type="button" class="delete-btn" onclick="deleteRow(${rowCount})">
                <i class="fas fa-times"></i>
               </button>` :
              ''}
        </td>
    `;

    tableBody.appendChild(newRow);

    // Animate the row insertion
    setTimeout(() => {
        newRow.classList.remove('row-inserting');
    }, 400);

    // Focus on the credit input of the new row
    setTimeout(() => {
        document.getElementById(`credit${rowCount}`).focus();
    }, 100);

    updateRowCounter();
}

function deleteRow(rowNumber) {
    const row = document.querySelector(`tr[data-row="${rowNumber}"]`);
    if (row) {
        // Add the deletion animation class
        row.classList.add('row-deleting');

        // Remove the row after animation completes
        setTimeout(() => {
            row.remove();
            rowCount--;
            updateRowCounter();
            renumberRows();
        }, 300);
    }
}

function renumberRows() {
    // Get all rows in the table body
    const rows = document.querySelectorAll('#tableBody tr');

    // Renumber the rows
    rows.forEach((row, index) => {
        const rowNum = index + 1;
        const oldRowNum = row.getAttribute('data-row');

        // Update custom subject names mapping if exists
        if (customSubjectNames[`Subject ${oldRowNum}`]) {
            customSubjectNames[`Subject ${rowNum}`] = customSubjectNames[`Subject ${oldRowNum}`];
            delete customSubjectNames[`Subject ${oldRowNum}`];
        }

        row.setAttribute('data-row', rowNum);

        // Update the subject number or use custom name if set
        const subjectName = row.querySelector('.subject-name');
        if (subjectName) {
            const customName = customSubjectNames[`Subject ${rowNum}`];
            subjectName.textContent = customName || `Subject ${rowNum}`;
        }

        // Update the input IDs
        const creditInput = row.querySelector('.credit-input');
        const marksInput = row.querySelector('.marks-input');

        if (creditInput) creditInput.id = `credit${rowNum}`;
        if (marksInput) marksInput.id = `marks${rowNum}`;

        // Update the delete button's onclick attribute if it exists
        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.setAttribute('onclick', `deleteRow(${rowNum})`);
        }
    });
}

function updateRowCounter() {
    document.getElementById('rowCount').textContent = rowCount;

    // Toggle the add button's disabled state based on row count
    const addBtn = document.getElementById('addRowBtn');
    if (rowCount >= MAX_ROWS) {
        addBtn.disabled = true;
        addBtn.style.opacity = '0.6';
        addBtn.style.cursor = 'not-allowed';
    } else {
        addBtn.disabled = false;
        addBtn.style.opacity = '1';
        addBtn.style.cursor = 'pointer';
    }
}

function calculate_SGPA() {
    try {
        // Get all rows in the table body
        const rows = document.querySelectorAll('#tableBody tr');

        // Check if we have at least one row
        if (rows.length === 0) {
            showError("Add at least one subject to calculate SGPA");
            return;
        }

        // Check semester is selected
        const semester = document.getElementById('semester').value;
        if (!semester) {
            showError("Please select a semester");
            document.getElementById('semester').style.borderColor = '#ff6b6b';
            setTimeout(() => {
                document.getElementById('semester').style.borderColor = '';
            }, 3000);
            return;
        }

        // Get all input values
        const subjectData = [];
        let hasEmptyFields = false;

        // Check each row for data
        rows.forEach(row => {
            const rowNum = row.getAttribute('data-row');
            const credit = document.getElementById(`credit${rowNum}`).value;
            const mark = document.getElementById(`marks${rowNum}`).value;

            // Get the subject name (either default or custom)
            const subjectNameElement = row.querySelector('.subject-name');
            const subjectName = subjectNameElement ? subjectNameElement.textContent : `Subject ${rowNum}`;

            // Skip if both fields are empty
            if (credit === "" && mark === "") {
                return;
            }

            // If one field is filled but the other is empty, flag as incomplete
            if (credit === "" || mark === "") {
                hasEmptyFields = true;
                // Highlight the empty field with a shake animation
                if (credit === "") highlightEmptyField(`credit${rowNum}`);
                if (mark === "") highlightEmptyField(`marks${rowNum}`);
            } else {
                const markValue = parseFloat(mark);
                const pointValue = getPointFromMark(markValue);

                subjectData.push({
                    name: subjectName,
                    credit: parseFloat(credit),
                    mark: markValue,
                    point: pointValue
                });
            }
        });

        // If no subjects were entered at all
        if (subjectData.length === 0) {
            showError("Please enter data for at least one subject");
            return;
        }

        // If some fields were left incomplete
        if (hasEmptyFields) {
            showError("Please complete all fields for each subject");
            return;
        }

        // Calculate SGPA
        let totalCredit = 0;
        let totalPoints = 0;

        subjectData.forEach(subject => {
            totalCredit += subject.credit;
            totalPoints += subject.credit * subject.point;
        });

        const SGPA = (totalPoints / totalCredit).toFixed(2);

        // Calculate percentage
        const percentage = ((SGPA * 10) - SGPA).toFixed(2);

        // Store the current results for saving
        currentResults = {
            studentName: document.getElementById('studentName').value,
            usn: document.getElementById('usn').value,
            semester: document.getElementById('semester').value,
            gradYear: document.getElementById('gradYear').value,
            date: new Date().toISOString(),
            sgpa: SGPA,
            percentage: percentage,
            subjects: subjectData
        };

        // Update result elements
    document.getElementById("result").innerText = `Your SGPA is: ${SGPA}`;
        document.getElementById("percentage").innerText = `Your Percentage is: ${percentage}%`;

        // Update grade display
        const gradeElement = document.getElementById("gradeDisplay");
        const gradeInfo = getGradeFromSGPA(SGPA);
        gradeElement.className = `grade ${gradeInfo.className}`;
        gradeElement.innerText = `${gradeInfo.letter} Grade`;
        gradeElement.style.display = 'inline-block';

        // Show the result container with animation
        const resultContainer = document.getElementById("resultContainer");
        resultContainer.classList.add("show");

        // Animate result text
        animateValue("result", 0, SGPA, 1500);
        animateValue("percentage", 0, percentage, 1500);

    } catch (error) {
        console.error("Calculation error:", error);
        showError("An error occurred during calculation. Please check your inputs.");
    }
}

function getGradeFromSGPA(sgpa) {
    if (sgpa >= 9.0) {
        return { letter: 'A+', className: 'grade-a' };
    } else if (sgpa >= 8.0) {
        return { letter: 'A', className: 'grade-a' };
    } else if (sgpa >= 7.0) {
        return { letter: 'B', className: 'grade-b' };
    } else if (sgpa >= 6.0) {
        return { letter: 'C', className: 'grade-c' };
    } else if (sgpa >= 5.0) {
        return { letter: 'D', className: 'grade-d' };
    } else {
        return { letter: 'F', className: 'grade-f' };
    }
}

function getPointFromMark(mark) {
    if (mark >= 90) {
        return 10;
    } else if (mark >= 80) {
        return 9;
    } else if (mark >= 70) {
        return 8;
    } else if (mark >= 60) {
        return 7;
    } else if (mark >= 50) {
        return 6;
    } else if (mark >= 40) {
        return 5;
    } else {
        return 0;
    }
}

function highlightEmptyField(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.style.borderColor = '#ff6b6b';
    element.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.5)';

    // Add shake animation
    element.classList.add('shake');

    // Remove animation and highlighting after it completes
    setTimeout(() => {
        element.classList.remove('shake');
        // Gradually revert to normal style over time
        setTimeout(() => {
            element.style.borderColor = '';
            element.style.boxShadow = '';
        }, 1500);
    }, 500);
}

function showError(message) {
    // Display error message in result container
    document.getElementById("result").innerText = message;
    document.getElementById("percentage").innerText = "Please fix the errors to calculate";

    // Hide grade display
    document.getElementById("gradeDisplay").style.display = 'none';

    // Show the result container with animation
    const resultContainer = document.getElementById("resultContainer");
    resultContainer.classList.add("show");

    // Style the error message
    document.getElementById("result").style.color = "#ff6b6b";
    document.getElementById("percentage").style.color = "#ff6b6b";

    // Reset styles after a delay
    setTimeout(() => {
        document.getElementById("result").style.color = "";
        document.getElementById("percentage").style.color = "";
    }, 3000);
}

// Save and download functions
function showSaveModal() {
    if (!currentResults) {
        showError("Please calculate SGPA first to save results");
        return;
    }

    const saveModal = document.getElementById('saveModal');
    saveModal.classList.add('show');

    // Pre-fill result name if semester is selected
    const semester = document.getElementById('semester').value;
    const name = document.getElementById('studentName').value.trim();
    if (semester) {
        let resultName = `Semester ${semester} Results`;
        if (name) {
            resultName = `${name} - ${resultName}`;
        }
        document.getElementById('resultName').value = resultName;
    }
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('show');

    // Clear inputs
    document.getElementById('resultName').value = '';
    document.getElementById('saveNotes').value = '';
}

function saveResult() {
    if (!currentResults) {
        return;
    }

    const resultName = document.getElementById('resultName').value.trim();
    const notes = document.getElementById('saveNotes').value.trim();

    if (!resultName) {
        alert('Please enter a name for this result.');
        return;
    }

    // Get results from localStorage
    let results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

    // Create result object
    const resultToSave = {
        ...currentResults,
        id: editingResultId || generateId(),
        name: resultName,
        notes: notes
    };

    // Check if editing or adding new
    if (editingResultId) {
        // Find the result and update it
        const resultIndex = results.findIndex(r => r.id === editingResultId);
        if (resultIndex !== -1) {
            results[resultIndex] = resultToSave;
        }
        editingResultId = null; // Reset editing state
    } else {
        // Add new result
        results.push(resultToSave);
    }

    // Save back to localStorage
    localStorage.setItem('sgpaResults', JSON.stringify(results));

    // Close modal and show success message
    closeSaveModal();
    alert('Result saved successfully!');
}

function showHistoryModal() {
    const historyModal = document.getElementById('historyModal');
    historyModal.classList.add('show');

    // Load history
    loadHistoryResults();
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('show');
}

function closeViewResultModal() {
    document.getElementById('viewResultModal').classList.remove('show');
}

function loadHistoryResults() {
    // Get results from localStorage
    const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

    if (!results || results.length === 0) {
        document.getElementById('noHistoryMessage').style.display = 'block';
        document.getElementById('historyTable').style.display = 'none';

        // Update analytics with zeros
        document.getElementById('averageSGPA').textContent = '0.00';
        document.getElementById('totalResults').textContent = '0';
        document.getElementById('highestSGPA').textContent = '0.00';
        document.getElementById('recentResults').textContent = '0';
        return;
    }

    // Show table and hide no records message
    document.getElementById('noHistoryMessage').style.display = 'none';
    document.getElementById('historyTable').style.display = 'table';

    // Calculate analytics
    const totalResults = results.length;
    let totalSGPA = 0;
    let highestSGPA = 0;
    let recentResults = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clear existing rows
    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = '';

    // Add each result to table
    results.forEach(result => {
        try {
            const row = document.createElement('tr');

            // Format date
            const date = new Date(result.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

            // Calculate analytics
            const sgpa = parseFloat(result.sgpa);
            totalSGPA += sgpa;
            if (sgpa > highestSGPA) highestSGPA = sgpa;
            if (date > thirtyDaysAgo) recentResults++;

            // Create display name for result
            const nameUsn = result.studentName && result.usn ?
                            `${result.studentName} (${result.usn})` :
                            result.studentName || result.usn || 'Unknown';

            // Create semester display
            const semesterDisplay = result.semester ? `Semester ${result.semester}` : '-';

            // Create SGPA display with color coding
            let sgpaClass = '';
            if (sgpa >= 9.0) sgpaClass = 'sgpa-high';
            else if (sgpa >= 7.0) sgpaClass = 'sgpa-medium';
            else if (sgpa >= 5.0) sgpaClass = 'sgpa-low';
            else sgpaClass = 'sgpa-fail';

            row.innerHTML = `
                <td data-label="Date">${formattedDate}</td>
                <td data-label="Name/USN">${nameUsn}</td>
                <td data-label="Semester">${semesterDisplay}</td>
                <td data-label="SGPA"><span class="${sgpaClass}">${result.sgpa}</span></td>
                <td data-label="Actions" class="action-btns">
                    <button type="button" class="btn-view" onclick="viewResultDetail('${result.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn-edit" onclick="editResult('${result.id}')" title="Edit Result">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn-names" onclick="editResultSubjects('${result.id}')" title="Edit Subject Names">
                        <i class="fas fa-font"></i>
                    </button>
                    <button type="button" class="btn-download" onclick="downloadSingleResult('${result.id}')" title="Download PDF">
                        <i class="fas fa-file-download"></i>
                    </button>
                    <button type="button" class="btn-delete" onclick="deleteResult('${result.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            historyTableBody.appendChild(row);
        } catch (error) {
            console.error("Error adding result to history table:", error, result);
        }
    });

    // Update analytics
    const averageSGPA = (totalSGPA / totalResults).toFixed(2);
    document.getElementById('averageSGPA').textContent = averageSGPA;
    document.getElementById('totalResults').textContent = totalResults;
    document.getElementById('highestSGPA').textContent = highestSGPA.toFixed(2);
    document.getElementById('recentResults').textContent = recentResults;

    // Add event listener for download all button
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllResults);

    // Add event listener for edit subject names button
    document.getElementById('editSubjectsHistoryBtn').addEventListener('click', showEditSubjectsModal);
}

function viewResultDetail(resultId) {
    try {
        // Get results from localStorage
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        const result = results.find(r => r.id === resultId);
        if (!result) {
            alert('Result not found. It may have been deleted.');
            return;
        }

        // Fill in details
        document.getElementById('detailName').textContent = result.studentName || '-';
        document.getElementById('detailUSN').textContent = result.usn || '-';
        document.getElementById('detailSemester').textContent = result.semester ? `Semester ${result.semester}` : '-';

        // Format date
        const date = new Date(result.date);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        document.getElementById('detailDate').textContent = formattedDate;

        // Fill in grade
        const gradeInfo = getGradeFromSGPA(result.sgpa);
        const detailGrade = document.getElementById('detailGrade');
        detailGrade.className = `grade ${gradeInfo.className}`;
        detailGrade.textContent = `${gradeInfo.letter} Grade`;

        // Fill in summary
        document.getElementById('detailSGPA').textContent = result.sgpa;
        document.getElementById('detailPercentage').textContent = `${result.percentage}%`;

        // Clear existing rows
        const detailTableBody = document.getElementById('detailTableBody');
        detailTableBody.innerHTML = '';

        // Add each subject to table
        if (result.subjects && result.subjects.length > 0) {
            result.subjects.forEach(subject => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="Subject">${subject.name}</td>
                    <td data-label="Credits">${subject.credit}</td>
                    <td data-label="Marks">${subject.mark}</td>
                    <td data-label="Grade Points">${subject.point}</td>
                `;
                detailTableBody.appendChild(row);
            });
        } else {
            // Show message if no subjects
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4">No subject data available</td>';
            detailTableBody.appendChild(row);
        }

        // Add event listeners for detail view buttons
        document.getElementById('editDetailResult').addEventListener('click', function() {
            editResult(resultId);
            closeViewResultModal();
        });

        document.getElementById('editDetailSubjects').addEventListener('click', function() {
            editResultSubjects(resultId);
            closeViewResultModal();
        });

        document.getElementById('downloadDetail').addEventListener('click', function() {
            downloadSingleResult(resultId);
        });

        // Show the modal
        document.getElementById('viewResultModal').classList.add('show');

        // Close history modal
        closeHistoryModal();
    } catch (error) {
        console.error("Error displaying result detail:", error);
        alert('An error occurred while loading the result details.');
    }
}

function editResultSubjects(resultId) {
    try {
        // Get results from localStorage
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        const result = results.find(r => r.id === resultId);
        if (!result || !result.subjects) {
            alert('Result or subject data not found.');
            return;
        }

        // Clear existing subjects list
        const subjectNamesList = document.getElementById('subjectNamesList');
        subjectNamesList.innerHTML = '';

        // Create edit fields for each subject
        result.subjects.forEach((subject, index) => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            formGroup.innerHTML = `
                <label for="subjectName${index}">Subject ${index + 1}</label>
                <input type="text" id="subjectName${index}" class="subject-name-input"
                       data-index="${index}" data-result-id="${resultId}" value="${subject.name}" placeholder="Enter subject name">
            `;

            subjectNamesList.appendChild(formGroup);
        });

        // Set up save button to update the correct result
        document.getElementById('saveSubjectNames').onclick = function() {
            saveResultSubjectNames(resultId);
        };

        // Show the modal
        document.getElementById('editSubjectsModal').classList.add('show');

        // If called from detail view, close it
        closeViewResultModal();
        // If called from history view, close it
        closeHistoryModal();
    } catch (error) {
        console.error("Error editing subject names:", error);
        alert('An error occurred while loading subject names for editing.');
    }
}

function saveResultSubjectNames(resultId) {
    try {
        // Get results from localStorage
        let results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        const resultIndex = results.findIndex(r => r.id === resultId);
        if (resultIndex === -1) {
            alert('Result not found. It may have been deleted.');
            closeEditSubjectsModal();
            return;
        }

        // Get all input values
        const inputs = document.querySelectorAll('.subject-name-input');

        // Update subject names in the result
        inputs.forEach(input => {
            const index = parseInt(input.getAttribute('data-index'));
            const newName = input.value.trim();

            if (newName && results[resultIndex].subjects[index]) {
                results[resultIndex].subjects[index].name = newName;
            }
        });

        // Save updated results
        localStorage.setItem('sgpaResults', JSON.stringify(results));

        // Close modal
        closeEditSubjectsModal();

        // Show confirmation
        alert('Subject names updated successfully!');
    } catch (error) {
        console.error("Error saving subject names:", error);
        alert('An error occurred while saving subject names.');
    }
}

function downloadSingleResult(resultId) {
    try {
        // Get results from localStorage
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        const result = results.find(r => r.id === resultId);
        if (!result) {
            alert('Result not found. It may have been deleted.');
            return;
        }

        // Generate PDF for this result
        generatePDF(result);
    } catch (error) {
        console.error("Error downloading result:", error);
        alert('An error occurred while generating the PDF.');
    }
}

function downloadAllResults() {
    try {
        // Get results from localStorage
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        if (!results || results.length === 0) {
            alert('No results available to download.');
            return;
        }

        alert(`Preparing to download ${results.length} PDFs. This may take a moment.`);

        // Create a progress counter
        let downloaded = 0;

        // Download each result with a slight delay to avoid browser freezing
        results.forEach((result, index) => {
            setTimeout(() => {
                try {
                    generatePDF(result);
                    downloaded++;

                    // Show completion message after all downloads
                    if (downloaded === results.length) {
                        alert('All PDFs have been downloaded successfully!');
                    }
                } catch (err) {
                    console.error(`Error generating PDF for result ${index}:`, err);
                }
            }, index * 1000); // 1-second delay between each PDF generation
        });
    } catch (error) {
        console.error("Error downloading all results:", error);
        alert('An error occurred while generating the PDFs.');
    }
}

function showEditSubjectsModal() {
    // Get all rows in the table body
    const rows = document.querySelectorAll('#tableBody tr');

    if (rows.length === 0) {
        alert('Please add subjects first.');
        return;
    }

    const subjectNamesList = document.getElementById('subjectNamesList');
    subjectNamesList.innerHTML = '';

    // Create edit fields for each subject
    rows.forEach(row => {
        const rowNum = row.getAttribute('data-row');
        const subjectNameElement = row.querySelector('.subject-name');
        const currentName = subjectNameElement ? subjectNameElement.textContent : `Subject ${rowNum}`;

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label for="subjectName${rowNum}">Subject ${rowNum}</label>
            <input type="text" id="subjectName${rowNum}" class="subject-name-input"
                   data-row="${rowNum}" value="${currentName}" placeholder="Enter subject name">
        `;

        subjectNamesList.appendChild(formGroup);
    });

    // Show the modal
    document.getElementById('editSubjectsModal').classList.add('show');
}

function closeEditSubjectsModal() {
    document.getElementById('editSubjectsModal').classList.remove('show');
}

function saveSubjectNamesChanges() {
    const inputs = document.querySelectorAll('.subject-name-input');

    inputs.forEach(input => {
        const rowNum = input.getAttribute('data-row');
        const newName = input.value.trim();

        if (newName && newName !== `Subject ${rowNum}`) {
            customSubjectNames[`Subject ${rowNum}`] = newName;

            // Update the display in the table
            const subjectElement = document.querySelector(`tr[data-row="${rowNum}"] .subject-name`);
            if (subjectElement) {
                subjectElement.textContent = newName;
            }
        } else {
            // Remove from custom names if set back to default
            delete customSubjectNames[`Subject ${rowNum}`];

            // Set back to default in table
            const subjectElement = document.querySelector(`tr[data-row="${rowNum}"] .subject-name`);
            if (subjectElement) {
                subjectElement.textContent = `Subject ${rowNum}`;
            }
        }
    });

    closeEditSubjectsModal();
}

// PDF generation functions
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

function downloadResult() {
    if (!currentResults) {
        showError("Please calculate SGPA first to download results");
        return;
    }

    try {
        generatePDF(currentResults);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

function downloadDetailResult() {
    try {
        // Get the result details from the modal
        const detailsData = {
            studentName: document.getElementById('detailName').textContent,
            usn: document.getElementById('detailUSN').textContent,
            semester: document.getElementById('detailSemester').textContent,
            sgpa: document.getElementById('detailSGPA').textContent,
            percentage: document.getElementById('detailPercentage').textContent.replace('%', ''),
            grade: document.getElementById('detailGrade').textContent.split(' ')[0],
            date: document.getElementById('detailDate').textContent,
            subjects: []
        };

        // Get subject details from table
        const rows = document.querySelectorAll('#detailTableBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 4) {
                detailsData.subjects.push({
                    name: cells[0].textContent,
                    credit: cells[1].textContent,
                    mark: cells[2].textContent,
                    point: cells[3].textContent
                });
            }
        });

        generatePDF(detailsData);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

function generatePDF(data) {
    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Set document properties
    doc.setProperties({
        title: 'SGPA Result Card',
        subject: 'SGPA Calculation Result',
        author: 'SGPA Calculator',
        creator: 'SGPA Calculator'
    });

    // Add university name and logo
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 25, 112); // Dark blue
    doc.text('UNIVERSITY GRADE CARD', 105, 20, { align: 'center' });

    // Add a decorative line
    doc.setDrawColor(25, 25, 112);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // Student details section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black

    // Student Details Box
    doc.setFillColor(240, 240, 255); // Light blue background
    doc.rect(20, 30, 170, 35, 'F');
    doc.setDrawColor(100, 100, 200);
    doc.setLineWidth(0.3);
    doc.rect(20, 30, 170, 35, 'S');

    // Student details header
    doc.setFontSize(14);
    doc.setTextColor(25, 25, 112);
    doc.text('STUDENT DETAILS', 105, 38, { align: 'center' });

    // Student details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const studentName = data.studentName || 'Not provided';
    const usn = data.usn || 'Not provided';
    const semester = data.semester || 'Not specified';

    doc.text(`Name: ${studentName}`, 30, 48);
    doc.text(`USN: ${usn}`, 30, 55);
    doc.text(`Semester: ${semester}`, 30, 62);

    // Today's date on the right side
    const today = new Date().toLocaleDateString();
    doc.text(`Date: ${today}`, 160, 48, { align: 'right' });

    // Results section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 25, 112);
    doc.text('MARKS SUMMARY', 105, 78, { align: 'center' });

    // Results box
    doc.setFillColor(240, 240, 255);
    doc.rect(20, 82, 170, 25, 'F');
    doc.setDrawColor(100, 100, 200);
    doc.rect(20, 82, 170, 25, 'S');

    // SGPA and percentage
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`SGPA: ${data.sgpa}`, 40, 92);
    doc.text(`Percentage: ${data.percentage}%`, 40, 100);

    // Grade with colored box
    let gradeColor;
    const grade = typeof data.grade === 'string' ? data.grade : getGradeFromSGPA(data.sgpa).letter;

    if (grade === 'A+' || grade === 'A') {
        gradeColor = [46, 204, 113]; // Green
    } else if (grade === 'B') {
        gradeColor = [52, 152, 219]; // Blue
    } else if (grade === 'C') {
        gradeColor = [241, 196, 15]; // Yellow
    } else if (grade === 'D') {
        gradeColor = [230, 126, 34]; // Orange
    } else {
        gradeColor = [231, 76, 60]; // Red
    }

    // Grade circle
    doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.circle(150, 92, 10, 'F');

    // Grade text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(grade, 150, 92 + 1, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Subject-wise marks table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 25, 112);
    doc.text('SUBJECT-WISE MARKS', 105, 120, { align: 'center' });

    // Table headers
    const headers = ['Subject', 'Credits', 'Marks', 'Grade Points'];
    const colWidths = [80, 25, 25, 40];
    let startY = 128;
    let currentY = startY;

    // Draw table header
    doc.setFillColor(200, 200, 240);
    doc.rect(20, currentY - 6, 170, 8, 'F');
    doc.setDrawColor(100, 100, 200);
    doc.rect(20, currentY - 6, 170, 8, 'S');

    // Draw header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(25, 25, 112);

    let currentX = 25;
    headers.forEach((header, i) => {
        doc.text(header, currentX, currentY - 1);
        currentX += colWidths[i];
    });

    currentY += 6;

    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const subjects = data.subjects || [];
    let rowCount = 0;

    subjects.forEach((subject, index) => {
        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(240, 240, 255);
        } else {
            doc.setFillColor(255, 255, 255);
        }

        doc.rect(20, currentY - 6, 170, 8, 'F');
        doc.setDrawColor(200, 200, 240);
        doc.rect(20, currentY - 6, 170, 8, 'S');

        // Subject data
        currentX = 25;

        // Truncate subject name if too long
        let subjectName = subject.name;
        if (subjectName.length > 30) {
            subjectName = subjectName.substring(0, 27) + '...';
        }

        doc.text(subjectName, currentX, currentY - 1);
        currentX += colWidths[0];

        doc.text(subject.credit.toString(), currentX, currentY - 1);
        currentX += colWidths[1];

        doc.text(subject.mark.toString(), currentX, currentY - 1);
        currentX += colWidths[2];

        doc.text(subject.point.toString(), currentX, currentY - 1);

        currentY += 8;
        rowCount++;

        // Check if we need a new page
        if (currentY > 270 && index < subjects.length - 1) {
            doc.addPage();
            currentY = 20;

            // Page header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(25, 25, 112);
            doc.text('SUBJECT-WISE MARKS (Continued)', 105, currentY, { align: 'center' });
            currentY += 10;

            // Draw table header again
            doc.setFillColor(200, 200, 240);
            doc.rect(20, currentY - 6, 170, 8, 'F');
            doc.setDrawColor(100, 100, 200);
            doc.rect(20, currentY - 6, 170, 8, 'S');

            // Draw header text
            currentX = 25;
            headers.forEach((header, i) => {
                doc.text(header, currentX, currentY - 1);
                currentX += colWidths[i];
            });

            currentY += 6;
        }
    });

    // If there are no subjects, add a message
    if (subjects.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.text('No subjects available', 105, currentY + 5, { align: 'center' });
    }

    // Horizontal line at bottom
    currentY += 15;
    doc.setDrawColor(25, 25, 112);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 190, currentY);

    // Footer text
    currentY += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer generated grade card and does not require signature.', 105, currentY, { align: 'center' });

    // Final verification
    currentY += 5;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, currentY, { align: 'center' });

    // Save the PDF
    let filename = `SGPA_Result_${usn.replace(/[^a-zA-Z0-9]/g, '')}_Sem${semester.replace(/\D/g, '')}.pdf`;
    doc.save(filename);
}

// Excel/CSV data functions for storing results
function exportDataToCSV() {
    // Get all results
    try {
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');
        if (!results.length) {
            alert('No data available to export.');
            return;
        }

        let csv = 'Result ID,Name,USN,Result Name,Semester,SGPA,Percentage,Date,Notes\n';

        // Add result data
        results.forEach(result => {
            const date = new Date(result.date).toLocaleDateString();
            csv += `${result.id},${result.studentName || ''},${result.usn || ''},${result.name || ''},${result.semester || ''},${result.sgpa},${result.percentage},${date},${result.notes || ''}\n`;
        });

        // Create and download CSV file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sgpa_results_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}

// Function to organize data in folder structure
function createFolderStructure() {
    // Since browsers can't directly create folders, we'll simulate a folder structure
    // with a hierarchical object that could be used for indexedDB or other storage

    const folderStructure = {
        semesters: {},
        results: []
    };

    try {
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        results.forEach(result => {
            // Add to results array
            folderStructure.results.push({
                id: result.id,
                name: result.name || '',
                date: result.date,
                sgpa: result.sgpa,
                percentage: result.percentage,
                studentName: result.studentName || '',
                usn: result.usn || ''
            });

            // Organize by semester
            const sem = result.semester || 'unknown';
            if (!folderStructure.semesters[sem]) {
                folderStructure.semesters[sem] = [];
            }

            folderStructure.semesters[sem].push({
                id: result.id,
                name: result.name || '',
                date: result.date,
                sgpa: result.sgpa,
                studentName: result.studentName || '',
                usn: result.usn || ''
            });
        });

        // Save the folder structure to localStorage
        localStorage.setItem('sgpaFolderStructure', JSON.stringify(folderStructure));
        console.log('Folder structure created successfully', folderStructure);
        return folderStructure;
    } catch (error) {
        console.error('Error creating folder structure:', error);
        return null;
    }
}

// Utility functions
function generateId() {
    return 'id_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Animation function for counting up the values
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;

        // Keep the original text but replace the number
        const originalText = element.innerText;
        const colonIndex = originalText.indexOf(':');

        if (colonIndex !== -1) {
            const prefix = originalText.substring(0, colonIndex + 2); // Include the colon and space
            element.innerText = `${prefix}${value.toFixed(2)}${elementId === 'percentage' ? '%' : ''}`;
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Add CSS for animations
document.head.insertAdjacentHTML('beforeend', `
<style>
@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    50% { transform: translateX(10px); }
    75% { transform: translateX(-10px); }
    100% { transform: translateX(0); }
}
.shake {
    animation: shake 0.5s ease-in-out;
}
</style>
`);

// Add edit subject names button to form
document.addEventListener('DOMContentLoaded', function() {
    // Add edit subject names button next to add row button
    const addRowContainer = document.querySelector('.add-row-container');
    if (addRowContainer) {
        const editNamesBtn = document.createElement('button');
        editNamesBtn.type = 'button';
        editNamesBtn.className = 'edit-names-btn';
        editNamesBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Names';
        editNamesBtn.addEventListener('click', showEditSubjectsModal);

        addRowContainer.appendChild(editNamesBtn);
    }

    // Create folder structure when app loads
    createFolderStructure();

    // Add an export data button to the history modal
    const historyModal = document.querySelector('#historyModal .modal');
    if (historyModal) {
        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.className = 'btn-export';
        exportButton.innerHTML = '<i class="fas fa-file-export"></i> Export All Data';
        exportButton.addEventListener('click', exportDataToCSV);

        // Find a good place to add it, e.g., after the title
        const title = historyModal.querySelector('h2');
        if (title) {
            title.insertAdjacentElement('afterend', exportButton);
        }
    }

    // Enhance UI with additional styles
    document.head.insertAdjacentHTML('beforeend', `
    <style>
    .edit-names-btn {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        padding: 0.7rem 1.2rem;
        border-radius: 50px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        margin-left: auto;
    }

    .edit-names-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-3px);
    }

    .btn-export {
        background: linear-gradient(135deg, #34495e, #2c3e50);
        color: white;
        padding: 0.6rem 1.2rem;
        border-radius: 50px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 auto 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .btn-export:hover {
        background: linear-gradient(135deg, #2c3e50, #1a2530);
        transform: translateY(-3px);
    }

    @media (max-width: 768px) {
        .add-row-container {
            flex-direction: column;
            gap: 0.8rem;
        }

        .edit-names-btn {
            margin-left: 0;
            width: 100%;
            justify-content: center;
        }
    }

    /* Enhance student info section */
    .student-info {
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 0.08);
        transition: all 0.3s ease;
    }

    .student-info:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    }

    /* Enhance results card */
    .result {
        border-radius: 20px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
        background: rgba(255, 255, 255, 0.12);
    }

    /* Add shimmer effect to results */
    @keyframes shimmer-highlight {
        0% {
            background-position: -100% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }

    .result.show p {
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.2) 25%,
            rgba(255, 255, 255, 0.1) 50%
        );
        background-size: 200% 100%;
        animation: shimmer-highlight 2s infinite linear;
        border-radius: 5px;
        padding: 5px;
    }
    </style>
    `);
});

// Add debugging utility function
function debugLocalStorage() {
    console.log("=== DEBUG LOCAL STORAGE ===");

    try {
        // Check browser storage availability
        console.log("Storage available: ", typeof localStorage !== 'undefined');

        // Check storage size
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = (key.length + value.length) * 2; // UTF-16 = 2 bytes per char
            totalSize += size;
            console.log(`Item: ${key}, Size: ${(size/1024).toFixed(2)} KB`);
        }
        console.log(`Total storage used: ${(totalSize/1024).toFixed(2)} KB`);

        // Test write ability
        try {
            localStorage.setItem('test_write', 'test_data');
            const testRead = localStorage.getItem('test_write');
            localStorage.removeItem('test_write');
            console.log("Write test: " + (testRead === 'test_data' ? 'SUCCESS' : 'FAILED'));
        } catch (e) {
            console.error("Write test failed:", e);
        }

        // Check specific SGPA data
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');
        console.log(`Results count: ${results.length}`);

        const folderStructure = JSON.parse(localStorage.getItem('sgpaFolderStructure') || '{}');
        console.log("Folder structure:", folderStructure);

        // Try clearing and recreating
        if (confirm('Do you want to reset the storage to fix issues?')) {
            // Clear and recreate
            localStorage.removeItem('sgpaResults');
            localStorage.removeItem('sgpaFolderStructure');

            // Create empty results array
            localStorage.setItem('sgpaResults', '[]');

            // Recreate folder structure
            createFolderStructure();

            alert('Storage has been reset. Try saving a new result.');
        }
    } catch (error) {
        console.error("Debug error:", error);
        alert("Debug error: " + error.message);
    }

    console.log("=== DEBUG COMPLETE ===");
}

function closeViewResultModal() {
    document.getElementById('viewResultModal').classList.remove('show');
}

function editResult(resultId) {
    try {
        // Get results from localStorage
        const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        const result = results.find(r => r.id === resultId);
        if (!result) {
            alert('Result not found. It may have been deleted.');
            return;
        }

        // Set as current result for editing
        currentResults = result;
        editingResultId = resultId;

        // Fill form with result data
        document.getElementById('studentName').value = result.studentName || '';
        document.getElementById('usn').value = result.usn || '';
        document.getElementById('semester').value = result.semester || '';
        document.getElementById('gradYear').value = result.gradYear || '';

        // Clear existing rows
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        rowCount = 0;

        // Create rows for each subject
        result.subjects.forEach(subject => {
            // Extract number from subject name if it follows the pattern "Subject X"
            let subjectNumber = rowCount + 1;
            if (subject.name.startsWith('Subject ')) {
                const match = subject.name.match(/Subject (\d+)/);
                if (match) {
                    subjectNumber = parseInt(match[1]);
                }
            } else {
                // This is a custom name
                customSubjectNames[`Subject ${subjectNumber}`] = subject.name;
            }

            addNewRow();
            document.getElementById(`credit${rowCount}`).value = subject.credit;
            document.getElementById(`marks${rowCount}`).value = subject.mark;

            // Update subject name display if custom
            if (customSubjectNames[`Subject ${rowCount}`]) {
                const subjectElement = document.querySelector(`tr[data-row="${rowCount}"] .subject-name`);
                if (subjectElement) {
                    subjectElement.textContent = customSubjectNames[`Subject ${rowCount}`];
                }
            }
        });

        // Calculate and display results
        calculate_SGPA();

        // Show save modal for editing
        showSaveModal();

        // Close history modal
        closeHistoryModal();
        // Close detail view if open
        closeViewResultModal();
    } catch (error) {
        console.error("Error editing result:", error);
        alert('An error occurred while loading the result for editing.');
    }
}

function deleteResult(resultId) {
    try {
        if (!confirm('Are you sure you want to delete this result?')) {
            return;
        }

        // Get results from localStorage
        let results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

        // Filter out the result to delete
        results = results.filter(r => r.id !== resultId);

        // Save back to localStorage
        localStorage.setItem('sgpaResults', JSON.stringify(results));

        // Refresh history display
        loadHistoryResults();

        // Alert success
        alert('Result deleted successfully.');
    } catch (error) {
        console.error("Error deleting result:", error);
        alert('An error occurred while deleting the result.');
    }
}

// Export data to CSV
function exportDataToCSV() {
    // Get all results
    const results = JSON.parse(localStorage.getItem('sgpaResults') || '[]');

    // Prepare CSV header
    let csv = 'ID,Name,USN,Date,Semester,SGPA,Percentage,Subjects,Credits,Marks\n';

    // Process each result
    results.forEach(result => {
        // Basic info
        let row = [
            result.id,
            `"${result.studentName || ''}"`,
            `"${result.usn || ''}"`,
            `"${result.date || ''}"`,
            result.semester || '',
            result.sgpa || '',
            result.percentage || ''
        ];

        // Add subjects, credits, and marks
        const subjectNames = result.subjects.map(s => `"${s.name}"`).join('|');
        const credits = result.subjects.map(s => s.credit).join('|');
        const marks = result.subjects.map(s => s.mark).join('|');

        row.push(`"${subjectNames}"`, `"${credits}"`, `"${marks}"`);

        // Add to CSV
        csv += row.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sgpa_calculator_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// New feature functions
function initScrollProgress() {
    const scrollProgress = document.getElementById('scrollProgress');

    window.addEventListener('scroll', () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolledPercentage = (window.scrollY / scrollableHeight) * 100;
        scrollProgress.style.width = `${scrolledPercentage}%`;
    });
}

function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    let darkMode = true; // Default is dark mode

    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('sgpaTheme');
    if (savedTheme) {
        darkMode = savedTheme === 'dark';
        applyTheme(darkMode);
    }

    themeToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        applyTheme(darkMode);
        localStorage.setItem('sgpaTheme', darkMode ? 'dark' : 'light');
    });
}

function applyTheme(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;

    if (isDark) {
        // Dark mode theme
        root.style.setProperty('--background', '#0f172a');
        root.style.setProperty('--text', '#ffffff');
        root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--input-text', '#ffffff');
        root.style.setProperty('--input-placeholder', 'rgba(255, 255, 255, 0.5)');
        root.style.setProperty('--table-header-bg', 'rgba(67, 97, 238, 0.2)');
        root.style.setProperty('--table-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--modal-bg', 'rgba(15, 23, 42, 0.9)');
        root.style.setProperty('--hover-bg', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--navbar-bg', 'rgba(15, 23, 42, 0.8)');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        // Light mode theme
        root.style.setProperty('--background', '#f8fafc');
        root.style.setProperty('--text', '#0f172a');
        root.style.setProperty('--card-bg', 'rgba(15, 23, 42, 0.05)');
        root.style.setProperty('--border-color', 'rgba(15, 23, 42, 0.1)');
        root.style.setProperty('--input-bg', 'rgba(15, 23, 42, 0.05)');
        root.style.setProperty('--input-text', '#0f172a');
        root.style.setProperty('--input-placeholder', 'rgba(15, 23, 42, 0.5)');
        root.style.setProperty('--table-header-bg', 'rgba(67, 97, 238, 0.1)');
        root.style.setProperty('--table-border', 'rgba(15, 23, 42, 0.1)');
        root.style.setProperty('--modal-bg', 'rgba(248, 250, 252, 0.95)');
        root.style.setProperty('--hover-bg', 'rgba(15, 23, 42, 0.05)');
        root.style.setProperty('--navbar-bg', 'rgba(248, 250, 252, 0.8)');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
}

// Initialize theme based on user preference
function initTheme() {
    // Default to dark mode if no preference is set
    if (localStorage.getItem('darkMode') === null) {
        localStorage.setItem('darkMode', 'true');
        applyTheme(true);
    } else {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        applyTheme(isDarkMode);
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    initTheme();

    // Set up theme toggle button
    document.getElementById('themeToggle').addEventListener('click', function() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        localStorage.setItem('darkMode', (!isDarkMode).toString());
        applyTheme(!isDarkMode);
    });
});