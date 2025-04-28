// PDF generation functions

// Helper function used by PDF generation for grades
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
    // Get all users and their results
    try {
        const users = JSON.parse(localStorage.getItem('sgpaUsers') || '[]');
        if (!users.length) {
            alert('No data available to export.');
            return;
        }
        
        let csv = 'User ID,Name,USN,Result ID,Result Name,Semester,SGPA,Percentage,Date\n';
        
        // Add user data
        users.forEach(user => {
            if (user.results && user.results.length) {
                user.results.forEach(result => {
                    const date = new Date(result.date).toLocaleDateString();
                    csv += `${user.id},${user.name},${user.usn},${result.id},${result.name || ''},${result.semester || ''},${result.sgpa},${result.percentage},${date}\n`;
                });
            }
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

// Create folder structure
function createFolderStructure() {
    // Since browsers can't directly create folders, we'll simulate a folder structure
    // with a hierarchical object that could be used for indexedDB or other storage
    
    const folderStructure = {
        students: {}
    };
    
    try {
        const users = JSON.parse(localStorage.getItem('sgpaUsers') || '[]');
        
        users.forEach(user => {
            if (!folderStructure.students[user.usn]) {
                folderStructure.students[user.usn] = {
                    name: user.name,
                    semesters: {}
                };
            }
            
            if (user.results && user.results.length) {
                user.results.forEach(result => {
                    const sem = result.semester || 'unknown';
                    
                    if (!folderStructure.students[user.usn].semesters[sem]) {
                        folderStructure.students[user.usn].semesters[sem] = [];
                    }
                    
                    folderStructure.students[user.usn].semesters[sem].push({
                        id: result.id,
                        name: result.name,
                        date: result.date,
                        sgpa: result.sgpa,
                        percentage: result.percentage
                    });
                });
            }
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