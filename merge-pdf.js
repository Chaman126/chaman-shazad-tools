/**
 * Chaman Shazad Tools - PDF Merging Logic (Client-Side)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const filesList = document.getElementById('filesList');
    const fileItemsContainer = document.getElementById('fileItemsContainer');
    const addMoreBtn = document.getElementById('addMoreBtn');
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

    let uploadedFiles = []; // Array of File objects
    let mergedBlobUrl = null;

    // Browse files trigger
    browseBtn.addEventListener('click', () => fileInput.click());
    addMoreBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop handlers
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
        let hasInvalid = false;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                // Ensure duplicate instances aren't added based on properties
                const exists = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    uploadedFiles.push(file);
                }
            } else {
                hasInvalid = true;
            }
        }

        if (hasInvalid) {
            alert('Some uploaded files were not valid PDFs and were skipped.');
        }

        if (uploadedFiles.length > 0) {
            renderFileList();
        }
    }

    // Render list with movement and delete actions
    function renderFileList() {
        fileItemsContainer.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const sizeInKB = (file.size / 1024).toFixed(1);
            const sizeText = sizeInKB > 1024 
                ? `${(sizeInKB / 1024).toFixed(1)} MB` 
                : `${sizeInKB} KB`;

            const itemNode = document.createElement('div');
            itemNode.className = 'file-item';
            itemNode.style.display = 'flex';
            itemNode.style.alignItems = 'center';
            itemNode.style.justifyContent = 'space-between';
            itemNode.style.gap = '1rem';

            itemNode.innerHTML = `
                <div class="file-info" style="flex-grow: 1; min-width: 0;">
                    <span style="font-weight: 700; color: var(--accent-blue); padding-right: 0.5rem;">${index + 1}.</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span class="file-name" style="font-size: 0.85rem;">${file.name}</span>
                    <span class="file-size">(${sizeText})</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
                    <!-- Move Up Button -->
                    <button class="btn-move-up" data-index="${index}" title="Move Up" style="background: none; border: 1px solid var(--border-glass); color: var(--text-secondary); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;" ${index === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        ▲
                    </button>
                    <!-- Move Down Button -->
                    <button class="btn-move-down" data-index="${index}" title="Move Down" style="background: none; border: 1px solid var(--border-glass); color: var(--text-secondary); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;" ${index === uploadedFiles.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        ▼
                    </button>
                    <!-- Remove Button -->
                    <button class="btn-remove" data-index="${index}" title="Remove File" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; transition: color 0.2s;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Action triggers
            itemNode.querySelector('.btn-move-up')?.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                swapItems(idx, idx - 1);
            });

            itemNode.querySelector('.btn-move-down')?.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                swapItems(idx, idx + 1);
            });

            itemNode.querySelector('.btn-remove')?.addEventListener('click', (e) => {
                const button = e.target.closest('.btn-remove');
                const idx = parseInt(button.getAttribute('data-index'));
                removeItem(idx);
            });

            fileItemsContainer.appendChild(itemNode);
        });

        dropzone.style.display = 'none';
        filesList.style.display = 'block';
        processPanel.style.display = 'block';
        startProcessBtn.style.display = 'inline-block';
        progressBarContainer.style.display = 'none';
        statusSuccess.style.display = 'none';
        statusError.style.display = 'none';
        actionPanel.style.display = 'none';
        
        progressStatusText.textContent = `${uploadedFiles.length} file(s) loaded. Ready to merge!`;
    }

    function swapItems(indexA, indexB) {
        const temp = uploadedFiles[indexA];
        uploadedFiles[indexA] = uploadedFiles[indexB];
        uploadedFiles[indexB] = temp;
        renderFileList();
    }

    function removeItem(index) {
        uploadedFiles.splice(index, 1);
        if (uploadedFiles.length === 0) {
            resetWorkspace();
        } else {
            renderFileList();
        }
    }

    function resetWorkspace() {
        uploadedFiles = [];
        fileInput.value = '';
        if (mergedBlobUrl) {
            URL.revokeObjectURL(mergedBlobUrl);
            mergedBlobUrl = null;
        }
        dropzone.style.display = 'block';
        filesList.style.display = 'none';
        processPanel.style.display = 'none';
        statusSuccess.style.display = 'none';
        statusError.style.display = 'none';
        actionPanel.style.display = 'none';
    }

    resetBtn.addEventListener('click', resetWorkspace);

    // Merge operations handler
    startProcessBtn.addEventListener('click', async () => {
        if (uploadedFiles.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }

        startProcessBtn.style.display = 'none';
        progressBarContainer.style.display = 'block';
        progressBarFill.style.width = '10%';
        progressStatusText.textContent = 'Initializing empty PDF compilation canvas...';

        try {
            // New blank PDFLib document
            const mergedDoc = await PDFLib.PDFDocument.create();
            const totalDocs = uploadedFiles.length;

            for (let i = 0; i < totalDocs; i++) {
                const file = uploadedFiles[i];
                progressStatusText.textContent = `Reading PDF doc buffer: ${i + 1}/${totalDocs} (${file.name})...`;
                
                // Read file
                const fileBytes = await readFileAsArrayBuffer(file);
                
                // Load PDF doc object
                const doc = await PDFLib.PDFDocument.load(fileBytes);
                
                // Copy all pages
                const pageIndices = Array.from({ length: doc.getPageCount() }, (_, index) => index);
                const copiedPages = await mergedDoc.copyPages(doc, pageIndices);
                
                copiedPages.forEach(page => mergedDoc.addPage(page));

                // Update progress percentages
                const percent = Math.min(Math.round(((i + 1) / totalDocs) * 90), 90);
                progressBarFill.style.width = `${percent}%`;
            }

            progressBarFill.style.width = '95%';
            progressStatusText.textContent = 'Compiling and packing final document stream...';

            const mergedPdfBytes = await mergedDoc.save();
            const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            mergedBlobUrl = URL.createObjectURL(mergedBlob);

            progressBarFill.style.width = '100%';
            progressStatusText.textContent = 'Consolidation complete!';
            statusSuccess.style.display = 'flex';
            actionPanel.style.display = 'flex';

        } catch (err) {
            console.error(err);
            showError('Merging failed. Ensure that all uploaded PDF files are not corrupt or password encrypted.');
        }
    });

    // Helper promise reader
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    // Handle Download merge pdf
    downloadBtn.addEventListener('click', () => {
        if (!mergedBlobUrl) return;
        const link = document.createElement('a');
        link.href = mergedBlobUrl;
        link.download = 'merged_document.pdf';
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
