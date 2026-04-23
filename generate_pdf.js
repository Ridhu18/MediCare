const fs = require('fs');
const { jsPDF } = require('jspdf');

/**
 * PDF Generator Script for Medicare+ Documentation
 * This uses the existing jspdf dependency in the project.
 */

try {
    // Read the source text file
    const content = fs.readFileSync('API_Documentation_Full.txt', 'utf-8');

    // Initialize PDF
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // Formatting settings
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - (margin * 2);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Split text to fit width
    const lines = doc.splitTextToSize(content, maxWidth);
    
    let cursorY = margin;

    lines.forEach((line) => {
        // Auto-paging logic
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        // Basic styling for headers (lines starting with [ or =)
        if (line.startsWith('[') || line.startsWith('=')) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 50, 150); // Medical Blue
        } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
        }

        doc.text(line, margin, cursorY);
        cursorY += 5; // Line height
    });

    // Save output
    doc.save('API_Documentation_Full.pdf');
    console.log("\x1b[32m%s\x1b[0m", "✔ Success: API_Documentation_Full.pdf has been generated in your project root.");

} catch (err) {
    console.error("\x1b[31m%s\x1b[0m", "✘ Error:", err.message);
    if (err.code === 'ENOENT') {
        console.log("Please make sure 'API_Documentation_Full.txt' exists in the root directory.");
    }
}
