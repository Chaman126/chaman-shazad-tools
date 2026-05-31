/**
 * Chaman Shazad Tools - JPG to PDF Converter Logic (Client-Side)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const filesList = document.getElementById('filesList');
    const fileItemsContainer = document.getElementById('fileItemsContainer');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const pdfPageSize = document.getElementById('pdfPageSize');
    const pdfOrientation = document.getElementById('pdfOrientation');
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

    let uploadedImages = []; // Array of File objects
    let compiledBlobUrl = null;

    // Trigger browse
    browseBtn.addEventListener('click', () => fileInput.click());
    addMoreBtn.addEventListener('click', () => fileInput.click());
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
        let hasInvalid = false;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileType = file.type;
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            
            if (validTypes.includes(fileType) || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                const exists = uploadedImages.some(img => img.name === file.name && img.size === file.size);
                if (!exists) {
                    uploadedImages.push(file);
                }
            } else {
                hasInvalid = true;
            }
        }

        if (hasInvalid) {
            alert('Some uploaded files were not valid images (JPG/PNG/WebP) and were skipped.');
        }

        if (uploadedImages.length > 0) {
            renderImageList();
        }
    }

    // Render list
    function renderImageList() {
        fileItemsContainer.innerHTML = '';
        
        uploadedImages.forEach((file, index) => {
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

            // Create object URL for simple thumbnail previews
            const thumbUrl = URL.createObjectURL(file);

            itemNode.innerHTML = `
                <div class="file-info" style="flex-grow: 1; min-width: 0;">
                    <span style="font-weight: 700; color: var(--accent-blue); padding-right: 0.5rem;">${index + 1}.</span>
                    <img src="${thumbUrl}" alt="Thumbnail" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-glass); flex-shrink: 0;" />
                    <span class="file-name" style="font-size: 0.85rem;">${file.name}</span>
                    <span class="file-size">(${sizeText})</span>
                </div>
                
                <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
                    <!-- Move Up Button -->
                    <button class="btn-move-up" data-index="${index}" title="Move Up" style="background: none; border: 1px solid var(--border-glass); color: var(--text-secondary); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;" ${index === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        ▲
                    </button>
                    <!-- Move Down Button -->
                    <button class="btn-move-down" data-index="${index}" title="Move Down" style="background: none; border: 1px solid var(--border-glass); color: var(--text-secondary); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer;" ${index === uploadedImages.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        ▼
                    </button>
                    <!-- Remove Button -->
                    <button class="btn-remove" data-index="${index}" title="Remove File" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; transition: color 0.2s;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Revoke URL to save browser memory after rendering thumbnail
            setTimeout(() => URL.revokeObjectURL(thumbUrl), 1000);

            // Reordering triggers
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
        
        progressStatusText.textContent = `${uploadedImages.length} image(s) loaded. Ready to convert!`;
    }

    function swapItems(indexA, indexB) {
        const temp = uploadedImages[indexA];
        uploadedImages[indexA] = uploadedImages[indexB];
        uploadedImages[indexB] = temp;
        renderImageList();
    }

    function removeItem(index) {
        uploadedImages.splice(index, 1);
        if (uploadedImages.length === 0) {
            resetWorkspace();
        } else {
            renderImageList();
        }
    }

    function resetWorkspace() {
        uploadedImages = [];
        fileInput.value = '';
        if (compiledBlobUrl) {
            URL.revokeObjectURL(compiledBlobUrl);
            compiledBlobUrl = null;
        }
        dropzone.style.display = 'block';
        filesList.style.display = 'none';
        processPanel.style.display = 'none';
        statusSuccess.style.display = 'none';
        statusError.style.display = 'none';
        actionPanel.style.display = 'none';
    }

    resetBtn.addEventListener('click', resetWorkspace);

    // Convert JPG to PDF
    startProcessBtn.addEventListener('click', async () => {
        if (uploadedImages.length === 0) return;

        startProcessBtn.style.display = 'none';
        progressBarContainer.style.display = 'block';
        progressBarFill.style.width = '10%';
        progressStatusText.textContent = 'Initializing PDF document pages...';

        try {
            const { jsPDF } = window.jspdf;
            const pageSizeOpt = pdfPageSize.value;
            const orientationOpt = pdfOrientation.value;

            let doc = null;
            const totalImages = uploadedImages.length;

            for (let i = 0; i < totalImages; i++) {
                const file = uploadedImages[i];
                progressStatusText.textContent = `Rendering image: ${i + 1}/${totalImages} (${file.name})...`;
                
                // Read image file as Data URL
                const imgDataUrl = await readFileAsDataURL(file);
                
                // Fetch image dimensions
                const dimensions = await getImageDimensions(imgDataUrl);
                
                // Setup page configuration
                let pageFormat = 'a4';
                let docOrientation = orientationOpt === 'landscape' ? 'l' : 'p';
                let width = 210;
                let height = 297;

                if (pageSizeOpt === 'letter') {
                    pageFormat = 'letter';
                    width = 215.9; // mm
                    height = 279.4; // mm
                } else if (pageSizeOpt === 'fit') {
                    // Page size matches exact pixel scale in mm (using standard 72 points/inch mapping)
                    width = (dimensions.width * 25.4) / 72;
                    height = (dimensions.height * 25.4) / 72;
                    pageFormat = [width, height];
                    docOrientation = dimensions.width > dimensions.height ? 'l' : 'p';
                }

                // Initialize document on first iteration
                if (i === 0) {
                    doc = new jsPDF({
                        orientation: docOrientation,
                        unit: 'mm',
                        format: pageFormat
                    });
                } else {
                    doc.addPage(pageFormat, docOrientation);
                }

                // Page dimensions for calculating aspect-ratio math
                const activeWidth = doc.internal.pageSize.getWidth();
                const activeHeight = doc.internal.pageSize.getHeight();

                // Draw image centered keeping aspect ratio
                let drawWidth = activeWidth;
                let drawHeight = (dimensions.height * drawWidth) / dimensions.width;

                if (drawHeight > activeHeight) {
                    drawHeight = activeHeight;
                    drawWidth = (dimensions.width * drawHeight) / dimensions.height;
                }

                const posX = (activeWidth - drawWidth) / 2;
                const posY = (activeHeight - drawHeight) / 2;

                doc.addImage(imgDataUrl, 'JPEG', posX, posY, drawWidth, drawHeight);

                // Update progress percentages
                const percent = Math.min(Math.round(((i + 1) / totalImages) * 90), 90);
                progressBarFill.style.width = `${percent}%`;
            }

            progressBarFill.style.width = '95%';
            progressStatusText.textContent = 'Packing image streams into PDF layout...';

            const pdfBlob = doc.output('blob');
            compiledBlobUrl = URL.createObjectURL(pdfBlob);

            progressBarFill.style.width = '100%';
            progressStatusText.textContent = 'Conversion successful!';
            statusSuccess.style.display = 'flex';
            actionPanel.style.display = 'flex';

        } catch (err) {
            console.error(err);
            showError('Conversion failed. Verify that your images are not corrupt and try again.');
        }
    });

    // Helper reader
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    // Helper image loader
    function getImageDimensions(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = dataUrl;
        });
    }

    // Handle PDF Download
    downloadBtn.addEventListener('click', () => {
        if (!compiledBlobUrl) return;
        const link = document.createElement('a');
        link.href = compiledBlobUrl;
        link.download = 'images_compiled.pdf';
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
