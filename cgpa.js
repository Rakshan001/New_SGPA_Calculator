/**
 * CGPA Calculator
 * This script handles the calculation of CGPA (Cumulative Grade Point Average)
 * by taking the sum of all semester SGPAs and dividing by the number of semesters.
 */

// DOM Elements
let cgpaForm;
let semesterInputs;
let calculateCGPABtn;
let addSemesterBtn;
let removeSemesterBtn;
let cgpaResult;
let cgpaPercentage;
let cgpaGradeDisplay;
let semesterCount;
let cgpaContainer;

// Initialize the CGPA calculator when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the CGPA calculator
    initCGPACalculator();

    // Setup event listeners
    setupEventListeners();
});

/**
 * Initialize the CGPA calculator
 */
function initCGPACalculator() {
    // Get DOM elements
    cgpaForm = document.getElementById('cgpaForm');
    semesterInputs = document.getElementById('semesterInputs');
    calculateCGPABtn = document.getElementById('calculateCGPA');
    addSemesterBtn = document.getElementById('addSemester');
    removeSemesterBtn = document.getElementById('removeSemester');
    cgpaResult = document.getElementById('cgpaResult');
    cgpaPercentage = document.getElementById('cgpaPercentage');
    cgpaGradeDisplay = document.getElementById('cgpaGradeDisplay');
    semesterCount = document.getElementById('semesterCount');
    cgpaContainer = document.getElementById('cgpaContainer');

    // Add initial semester inputs
    addInitialSemesters(4); // Start with 4 semesters by default
    updateSemesterCount();
}

/**
 * Setup event listeners for the CGPA calculator
 */
function setupEventListeners() {
    // Calculate CGPA button click event
    if (calculateCGPABtn) {
        calculateCGPABtn.addEventListener('click', calculateCGPA);
    }

    // Add semester button click event
    if (addSemesterBtn) {
        addSemesterBtn.addEventListener('click', function() {
            addSemesterInput();
            updateSemesterCount();
        });
    }

    // Remove semester button click event
    if (removeSemesterBtn) {
        removeSemesterBtn.addEventListener('click', function() {
            removeSemesterInput();
            updateSemesterCount();
        });
    }

    // Form reset event
    if (cgpaForm) {
        cgpaForm.addEventListener('reset', function() {
            // Reset the form and add initial semesters
            setTimeout(function() {
                semesterInputs.innerHTML = '';
                addInitialSemesters(4);
                updateSemesterCount();

                // Reset result display
                cgpaResult.textContent = 'Your CGPA will appear here';
                cgpaPercentage.textContent = 'Your percentage will appear here';
                cgpaGradeDisplay.textContent = 'Grade';
                cgpaGradeDisplay.className = 'grade';

                // Hide result container if it's visible
                if (cgpaContainer && cgpaContainer.classList.contains('show-result')) {
                    cgpaContainer.classList.remove('show-result');
                }
            }, 10);
        });
    }
}

/**
 * Add initial semester inputs
 * @param {number} count - Number of initial semesters to add
 */
function addInitialSemesters(count) {
    for (let i = 0; i < count; i++) {
        addSemesterInput();
    }
}

/**
 * Add a new semester input row
 */
function addSemesterInput() {
    const semesterCount = document.querySelectorAll('.semester-input').length + 1;

    const semesterRow = document.createElement('div');
    semesterRow.className = 'semester-input';

    semesterRow.innerHTML = `
        <div class="semester-label">Semester ${semesterCount}</div>
        <div class="semester-field">
            <input type="number" class="sgpa-input" placeholder="Enter SGPA" min="0" max="10" step="0.01">
        </div>
    `;

    semesterInputs.appendChild(semesterRow);
}

/**
 * Remove the last semester input row
 */
function removeSemesterInput() {
    const semesterRows = document.querySelectorAll('.semester-input');

    if (semesterRows.length > 1) {
        semesterInputs.removeChild(semesterRows[semesterRows.length - 1]);
    }
}

/**
 * Update the semester count display
 */
function updateSemesterCount() {
    const count = document.querySelectorAll('.semester-input').length;
    if (semesterCount) {
        semesterCount.textContent = count;
    }

    // Disable remove button if only one semester is left
    if (removeSemesterBtn) {
        removeSemesterBtn.disabled = count <= 1;
    }
}

/**
 * Calculate CGPA based on semester SGPAs
 */
function calculateCGPA() {
    const sgpaInputs = document.querySelectorAll('.sgpa-input');
    let validInputs = 0;
    let totalSGPA = 0;

    // Validate inputs and calculate total SGPA
    for (let i = 0; i < sgpaInputs.length; i++) {
        const sgpaValue = parseFloat(sgpaInputs[i].value);

        // Check if input is valid
        if (!isNaN(sgpaValue) && sgpaValue >= 0 && sgpaValue <= 10) {
            totalSGPA += sgpaValue;
            validInputs++;

            // Reset error styling if any
            sgpaInputs[i].classList.remove('error');
        } else {
            // Add error styling
            sgpaInputs[i].classList.add('error');
        }
    }

    // If no valid inputs, show error
    if (validInputs === 0) {
        alert('Please enter valid SGPA values (between 0 and 10)');
        return;
    }

    // Calculate CGPA
    const cgpa = totalSGPA / validInputs;

    // Calculate percentage (CGPA * 9.5)
    const percentage = cgpa * 9.5;

    // Display results
    cgpaResult.textContent = cgpa.toFixed(2);
    cgpaPercentage.textContent = percentage.toFixed(2) + '%';

    // Set grade display
    updateGradeDisplay(cgpa);

    // Show result container
    if (cgpaContainer) {
        cgpaContainer.classList.add('show-result');
    }

    // Scroll to result
    document.getElementById('cgpaResultContainer').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Update the grade display based on CGPA
 * @param {number} cgpa - The calculated CGPA
 */
function updateGradeDisplay(cgpa) {
    let gradeClass = '';
    let gradeText = '';

    // Determine grade based on CGPA
    if (cgpa >= 9.0) {
        gradeClass = 'grade-a-plus';
        gradeText = 'A+ Grade';
    } else if (cgpa >= 8.0) {
        gradeClass = 'grade-a';
        gradeText = 'A Grade';
    } else if (cgpa >= 7.0) {
        gradeClass = 'grade-b';
        gradeText = 'B Grade';
    } else if (cgpa >= 6.0) {
        gradeClass = 'grade-c';
        gradeText = 'C Grade';
    } else if (cgpa >= 5.0) {
        gradeClass = 'grade-d';
        gradeText = 'D Grade';
    } else {
        gradeClass = 'grade-f';
        gradeText = 'F Grade';
    }

    // Update grade display
    cgpaGradeDisplay.textContent = gradeText;

    // Remove all grade classes and add the current one
    cgpaGradeDisplay.className = 'grade ' + gradeClass;
}

/**
 * Save CGPA result to localStorage
 */
function saveCGPAResult() {
    const cgpa = parseFloat(cgpaResult.textContent);
    const percentage = parseFloat(cgpaPercentage.textContent);

    if (isNaN(cgpa) || isNaN(percentage)) {
        alert('Please calculate CGPA first');
        return;
    }

    // Create result object
    const result = {
        date: new Date().toISOString(),
        cgpa: cgpa.toFixed(2),
        percentage: percentage.toFixed(2),
        semesters: []
    };

    // Get all semester SGPAs
    const sgpaInputs = document.querySelectorAll('.sgpa-input');
    for (let i = 0; i < sgpaInputs.length; i++) {
        const sgpaValue = parseFloat(sgpaInputs[i].value);
        if (!isNaN(sgpaValue) && sgpaValue >= 0 && sgpaValue <= 10) {
            result.semesters.push({
                semester: i + 1,
                sgpa: sgpaValue.toFixed(2)
            });
        }
    }

    // Get existing results from localStorage
    let savedResults = [];
    try {
        const savedData = localStorage.getItem('cgpaResults');
        if (savedData) {
            savedResults = JSON.parse(savedData);
        }
    } catch (error) {
        console.error('Error retrieving saved results:', error);
    }

    // Add new result
    savedResults.push(result);

    // Save to localStorage
    try {
        localStorage.setItem('cgpaResults', JSON.stringify(savedResults));
        alert('CGPA result saved successfully!');
    } catch (error) {
        console.error('Error saving result:', error);
        alert('Failed to save result. Local storage might be full or disabled.');
    }
}