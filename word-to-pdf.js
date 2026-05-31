/**
 * Chaman Shazad Tools - Word to PDF Converter Logic (Client-Side)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const filesList = document.getElementById('filesList');
    const fileNameText = document.getElementById('fileNameText');
    const fileSizeText = document.getElementById('fileSizeText');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const processPanel = document.getElementById('processPanel');
    const startProcessBtn = document.getElementById('startProcessBtn');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatusText = document.getElementById('progressStatusText');
    const statusSuccess = document.getElementById('statusSuccess');
    const statusError = document.getElementById('statusError');
    const errorText = document.getElementById('errorText');
    const actionPanel = document.getElementById('actionPanel');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let selectedFile = null;
    let convertedBlobUrl = null;
    let convertedFileName = '';

    // File Browse Event
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }

    function handleFiles(files) {
        const file = files[0];
        if (!file.name.endsWith('.docx')) {
            showError('Please upload a valid Word document (.docx format).');
            return;
        }

        selectedFile = file;
        fileNameText.textContent = file.name;
        
        // Calculate file size
        const sizeInKB = (file.size / 1024).toFixed(1);
        fileSizeText.textContent = sizeInKB > 1024 
            ? `(${(sizeInKB / 1024).toFixed(1)} MB)` 
            : `(${sizeInKB} KB)`;

        dropzone.style.display = 'none';
        filesList.style.display = 'block';
        processPanel.style.display = 'block';
        startProcessBtn.style.display = 'inline-block';
        progressBarContainer.style.display = 'none';
        statusSuccess.style.display = 'none';
        statusError.style.display = 'none';
        actionPanel.style.display = 'none';
        
        progressStatusText.textContent = 'Word document loaded. Ready to render!';
    }

    // Remove File click
    removeFileBtn.addEventListener('click', resetWorkspace);

    function resetWorkspace() {
        selectedFile = null;
        fileInput.value = '';
        if (convertedBlobUrl) {
            URL.revokeObjectURL(convertedBlobUrl);
            convertedBlobUrl = null;
        }
        dropzone.style.display = 'block';
        filesList.style.display = 'none';
        processPanel.style.display = 'none';
        statusSuccess.style.display = 'none';
        statusError.style.display = 'none';
        actionPanel.style.display = 'none';
    }

    resetBtn.addEventListener('click', resetWorkspace);

    // Word to PDF Render Process
    startProcessBtn.addEventListener('click', () => {
        if (!selectedFile) return;

        startProcessBtn.style.display = 'none';
        progressBarContainer.style.display = 'block';
        progressBarFill.style.width = '10%';
        progressStatusText.textContent = 'Loading Word document binary content...';

        const fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                const arrayBuffer = this.result;
                
                progressBarFill.style.width = '30%';
                progressStatusText.textContent = 'Parsing DOCX structure via Mammoth browser compiler...';

                // Mammoth parses DOCX to clean HTML
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                const htmlContent = result.value;
                const messages = result.messages;
                
                console.log("Mammoth warnings: ", messages);

                progressBarFill.style.width = '60%';
                progressStatusText.textContent = 'Initializing jsPDF output canvas...';

                // Create a temporary document node to parse the HTML structure
                const parser = new DOMParser();
                const docNode = parser.parseFromString(htmlContent, 'text/html');

                // Initialize standard A4 PDF document
                // dimensions: 210mm x 297mm. margins: 20mm
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4'
                });

                const pageWidth = 210;
                const pageHeight = 297;
                const margin = 20;
                const maxLineWidth = pageWidth - (margin * 2);
                let currentY = margin;

                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(11);

                // Extrapolate all paragraph elements from Mammoth conversion
                const paragraphs = docNode.querySelectorAll('p, h1, h2, h3, li');
                
                if (paragraphs.length === 0) {
                    throw new Error("No paragraphs detected in document.");
                }

                progressStatusText.textContent = 'Formatting and drawing PDF lines...';

                paragraphs.forEach((p, idx) => {
                    const text = p.textContent.trim();
                    if (!text) return;

                    let fontSize = 11;
                    let fontStyle = 'normal';
                    let leading = 6; // Spacing

                    // Detect headings or list bullet styles
                    if (p.tagName === 'H1') {
                        fontSize = 18;
                        fontStyle = 'bold';
                        leading = 9;
                    } else if (p.tagName === 'H2') {
                        fontSize = 15;
                        fontStyle = 'bold';
                        leading = 8;
                    } else if (p.tagName === 'H3') {
                        fontSize = 13;
                        fontStyle = 'bold';
                        leading = 7;
                    } else if (p.tagName === 'LI') {
                        fontSize = 11;
                        fontStyle = 'normal';
                        leading = 6;
                    }

                    pdf.setFont('Helvetica', fontStyle);
                    pdf.setFontSize(fontSize);

                    // Add bullet symbol to lists
                    let textToDraw = text;
                    if (p.tagName === 'LI') {
                        textToDraw = '• ' + text;
                    }

                    // Split lines to fit page bounds
                    const lines = pdf.splitTextToSize(textToDraw, maxLineWidth);

                    lines.forEach(line => {
                        // Create new page if lines overflow
                        if (currentY + leading > pageHeight - margin) {
                            pdf.addPage();
                            currentY = margin;
                        }
                        pdf.text(line, margin, currentY);
                        currentY += leading;
                    });

                    // Add small segment break padding
                    currentY += 3;
                });

                progressBarFill.style.width = '90%';
                progressStatusText.textContent = 'Compiling PDF package...';

                // Output raw PDF Blob
                const pdfBlob = pdf.output('blob');
                convertedBlobUrl = URL.createObjectURL(pdfBlob);
                convertedFileName = selectedFile.name.replace(/\.docx$/i, '') + '.pdf';

                progressBarFill.style.width = '100%';
                progressStatusText.textContent = 'Conversion successfully completed!';
                statusSuccess.style.display = 'flex';
                actionPanel.style.display = 'flex';

            } catch (err) {
                console.error(err);
                showError('Processing error. Ensure document contains readable text and try again.');
            }
        };

        fileReader.onerror = () => {
            showError('FileReader read error.');
        };

        fileReader.readAsArrayBuffer(selectedFile);
    });

    // Handle PDF Download action
    downloadBtn.addEventListener('click', () => {
        if (!convertedBlobUrl) return;
        const link = document.createElement('a');
        link.href = convertedBlobUrl;
        link.download = convertedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    function showError(msg) {
        progressBarContainer.style.display = 'none';
        startProcessBtn.style.display = 'none';
        progressStatusText.textContent = 'Process aborted.';
        errorText.textContent = msg;
        statusError.style.display = 'flex';
        actionPanel.style.display = 'flex';
    }
});
