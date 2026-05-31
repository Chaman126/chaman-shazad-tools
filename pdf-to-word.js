/**
 * Chaman Shazad Tools - PDF to Word Converter Logic (Client-Side)
 */

document.addEventListener('DOMContentLoaded', () => {
    // PDF.js global configuration
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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

    // Trigger browse file
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop Events
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
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            showError('Please upload a valid PDF file.');
            return;
        }

        selectedFile = file;
        fileNameText.textContent = file.name;
        
        // Formating size details
        const sizeInKB = (file.size / 1024).toFixed(1);
        fileSizeText.textContent = sizeInKB > 1024 
            ? `(${(sizeInKB / 1024).toFixed(1)} MB)` 
            : `(${sizeInKB} KB)`;

        // Show UI details
        dropzone.style.display = 'none';
        filesList.style.display = 'block';
        processPanel.style.display = 'block';
        startProcessBtn.style.display = 'inline-block';
        progressBarContainer.style.display = 'none';
        statusSuccess.style.display = 'none';
        statusError.style.display = 'none';
        actionPanel.style.display = 'none';
        
        progressStatusText.textContent = 'File uploaded successfully. Ready to convert!';
    }

    // Remove File
    removeFileBtn.addEventListener('click', resetWorkspace);

    // Reset workspace function
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

    // Main Conversion Logic
    startProcessBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        startProcessBtn.style.display = 'none';
        progressBarContainer.style.display = 'block';
        progressBarFill.style.width = '0%';
        progressStatusText.textContent = 'Initializing PDF.js reader...';

        const fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                
                // Load the PDF
                const loadingTask = pdfjsLib.getDocument(typedarray);
                const pdf = await loadingTask.promise;
                
                const numPages = pdf.numPages;
                let fullHtmlText = '';

                progressStatusText.textContent = `Extracting pages (0/${numPages})...`;

                // Loop pages
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    let pageText = '';
                    let lastY = -1;

                    // Sort items by vertical position top-to-bottom, horizontal left-to-right
                    const items = textContent.items.sort((a, b) => {
                        if (Math.abs(a.transform[5] - b.transform[5]) < 5) {
                            return a.transform[4] - b.transform[4];
                        }
                        return b.transform[5] - a.transform[5];
                    });

                    items.forEach(item => {
                        // Detect line breaks based on Y transform positioning
                        const currentY = item.transform[5];
                        if (lastY !== -1 && Math.abs(currentY - lastY) > 8) {
                            pageText += '</p><p>';
                        }
                        pageText += item.str + ' ';
                        lastY = currentY;
                    });

                    // Build page segments
                    fullHtmlText += `<div class="page-content"><p>${pageText}</p></div>`;
                    
                    if (i < numPages) {
                        fullHtmlText += '<br clear="all" style="page-break-before:always" />';
                    }

                    // Update UI progress
                    const progressPercent = Math.min(Math.round((i / numPages) * 100), 90);
                    progressBarFill.style.width = `${progressPercent}%`;
                    progressStatusText.textContent = `Extracting page text layout (${i}/${numPages})...`;
                }

                // Finalize DOCX template wrapping
                progressBarFill.style.width = '100%';
                progressStatusText.textContent = 'Formatting Word Open XML blocks...';
                
                const docHtmlContent = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                          xmlns:w="urn:schemas-microsoft-com:office:word" 
                          xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <title>Converted PDF Document</title>
                        <!--[if gte mso 9]>
                        <xml>
                            <w:WordDocument>
                                <w:View>Print</w:View>
                                <w:Zoom>100</w:Zoom>
                                <w:DoNotOptimizeForBrowser/>
                            </w:WordDocument>
                        </xml>
                        <![endif]-->
                        <style>
                            body {
                                font-family: 'Calibri', Arial, sans-serif;
                                font-size: 11pt;
                                line-height: 1.25;
                                margin: 1in;
                            }
                            p {
                                margin: 0 0 6pt 0;
                            }
                            .page-content {
                                margin-bottom: 20pt;
                            }
                        </style>
                    </head>
                    <body>
                        ${fullHtmlText}
                    </body>
                    </html>
                `;

                // Build download package
                const blob = new Blob(['\ufeff' + docHtmlContent], { type: 'application/msword' });
                convertedBlobUrl = URL.createObjectURL(blob);
                convertedFileName = selectedFile.name.replace(/\.pdf$/i, '') + '.doc';

                // Display success
                progressBarContainer.style.display = 'none';
                progressStatusText.textContent = 'Extraction successfully completed!';
                statusSuccess.style.display = 'flex';
                actionPanel.style.display = 'flex';

            } catch (err) {
                console.error(err);
                showError('Could not process PDF. The file may be corrupt or encrypted.');
            }
        };

        fileReader.onerror = () => {
            showError('FileReader read error.');
        };

        fileReader.readAsArrayBuffer(selectedFile);
    });

    // Handle Click download
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
