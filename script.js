document.addEventListener('DOMContentLoaded', () => {

    const marqueeInner = document.getElementById('marquee-inner');
    const marqueeScaleFactor = 5.5;
    
    const totalArtworksSpan = document.getElementById('total-artworks');
    const largestArtworkNameSpan = document.getElementById('largest-artwork-name');
    const largestArtworkMeasureSpan = document.getElementById('largest-artwork-measure');
    const smallestArtworkNameSpan = document.getElementById('smallest-artwork-name');
    const smallestArtworkMeasureSpan = document.getElementById('smallest-artwork-measure');
    const countMiniaturesSpan = document.getElementById('count-miniatures');
    const countPaintingsSpan = document.getElementById('count-paintings');
    
    const unitToggleBtn = document.getElementById('unit-toggle-btn');

    const galleryContainer = document.getElementById('gallery-container');
    const filterControls = document.getElementById('filter-controls'); 
    const modal = document.getElementById('full-size-modal');
    const modalVisualContent = document.getElementById('modal-visual-content');
    
    if (modal) modal.style.display = 'none';

    const GALLERY_PADDING = 20;     
    const MIN_SPACING = 5;          
    const TARGET_ROW_COUNT = 5;     
    const MAX_DIMENSION_PX = 1200;  
    const MODAL_CM_SCALE = 37.8; // 1cm = 37.8px aprox
    const CM_TO_INCH = 0.393701;
    
    // Referencias (CM)
    const PERSON_HEIGHT_CM = 170; 
    const COIN_DIAMETER_CM = 2.42; 

    const csvFilePath = 'Database.csv';
    let allArtworkData = []; 
    let allGalleryItems = []; 
    let globalScaleFactor = 0; 
    let isMetric = false; 

    function dimensionCMToNumbers(dimText) {
        if (!dimText) return { heightCM: 0, widthCM: 0 };
        const cleaned = dimText.toLowerCase().replace(/x/g, ' ').split(/\s+/);
        const h = parseFloat(cleaned[0]);
        const w = parseFloat(cleaned[1]);
        return { heightCM: h || 0, widthCM: w || 0 };
    }

    // Ordenar Menor a Mayor Área
    function sortData(data) {
        return data.sort((a, b) => {
            const dimA = dimensionCMToNumbers(a['DIMSENSIONS (CM)']); 
            const dimB = dimensionCMToNumbers(b['DIMSENSIONS (CM)']);
            const areaA = dimA.heightCM * dimA.widthCM;
            const areaB = dimB.heightCM * dimB.widthCM;
            return areaA - areaB;
        });
    }

    function updateEditorialText() {
        if (unitToggleBtn) {
            unitToggleBtn.textContent = isMetric ? 'SWITCH TO INCHES (IN)' : 'SWITCH TO CENTIMETERS (CM)';
        }
        if (largestArtworkNameSpan && largestArtworkMeasureSpan) {
            largestArtworkNameSpan.textContent = 'Helen Brought to Paris';
            largestArtworkMeasureSpan.textContent = isMetric ? '143.3 x 198.4 cm' : '56.4 x 78.1 in';
        }
        if (smallestArtworkNameSpan && smallestArtworkMeasureSpan) {
            smallestArtworkNameSpan.textContent = 'Eye of a Lady';
            smallestArtworkMeasureSpan.textContent = isMetric ? '1.5 x 1.8 cm' : '0.6 x 0.7 in';
        }
    }

    function setupEditorialSection(data) {
        if (data.length === 0) return;
        const countMiniatures = data.filter(item => item.TYPE && item.TYPE.toLowerCase().includes('miniature')).length;
        const countPaintings = data.filter(item => item.TYPE && item.TYPE.toLowerCase().includes('painting')).length;

        if (totalArtworksSpan) totalArtworksSpan.textContent = data.length;
        updateEditorialText();
        if (countMiniaturesSpan) countMiniaturesSpan.textContent = countMiniatures;
        if (countPaintingsSpan) countPaintingsSpan.textContent = countPaintings;
    }

    if (unitToggleBtn) {
        unitToggleBtn.addEventListener('click', () => {
            isMetric = !isMetric;
            updateEditorialText();
        });
    }
    
    function setupImageMarquee(artworkData) {
        if (!marqueeInner) return;
        const marqueeItems = [...artworkData].sort(() => Math.random() - 0.5).slice(0, 30);
        const elements = marqueeItems.map(item => {
            const { heightCM } = dimensionCMToNumbers(item['DIMSENSIONS (CM)']);
            if (heightCM === 0 || !item['MEDIA URL']) return null;
            const heightPx = heightCM * marqueeScaleFactor;
            const wrapper = document.createElement('div');
            wrapper.className = 'marquee-item';
            const img = document.createElement('img');
            img.src = item['MEDIA URL'];
            img.className = 'marquee-img';
            img.style.height = `${heightPx}px`;
            wrapper.appendChild(img);
            return wrapper;
        }).filter(Boolean);

        if (elements.length > 0) {
            marqueeInner.innerHTML = ''; 
            marqueeInner.append(...elements);
            marqueeInner.append(...elements.map(el => el.cloneNode(true)));
        }
    }

    function calculateDynamicScale(data, availableWidth) {
        const itemsToCalculate = data.slice(0, Math.min(TARGET_ROW_COUNT, data.length)); 
        if (itemsToCalculate.length === 0) return 2.5; 

        let totalCmWidth = 0;
        itemsToCalculate.forEach(item => {
            const { widthCM } = dimensionCMToNumbers(item['DIMSENSIONS (CM)']);
            totalCmWidth += widthCM;
        });

        const effectiveAvailableWidth = availableWidth - (GALLERY_PADDING * 2);
        const totalSpacing = (itemsToCalculate.length - 1) * MIN_SPACING;
        if (totalCmWidth === 0 || effectiveAvailableWidth <= 0) return 2.5; 

        const baseScale = (effectiveAvailableWidth - totalSpacing) / totalCmWidth; 
        return baseScale * 1.25; 
    }
    
    function positionGalleryItems(itemsToPosition) {
        if (!galleryContainer) return;
        const containerRect = galleryContainer.getBoundingClientRect();
        const effectiveAvailableWidth = containerRect.width - (GALLERY_PADDING * 2);

        const preparedItems = itemsToPosition.filter(item => !item.classList.contains('filtered')).map(itemDiv => {
            const widthCM = parseFloat(itemDiv.dataset.widthCm);
            const heightCM = parseFloat(itemDiv.dataset.heightCm);
            let finalWidthPX = widthCM * globalScaleFactor; 
            let finalHeightPX = heightCM * globalScaleFactor;
            
            if (finalWidthPX > MAX_DIMENSION_PX || finalHeightPX > MAX_DIMENSION_PX) {
                const ratio = finalWidthPX / finalHeightPX;
                if (finalWidthPX > finalHeightPX) {
                    finalWidthPX = MAX_DIMENSION_PX;
                    finalHeightPX = finalWidthPX / ratio;
                } else {
                    finalHeightPX = MAX_DIMENSION_PX;
                    finalWidthPX = finalHeightPX * ratio;
                }
            }
            return { div: itemDiv, width: finalWidthPX, height: finalHeightPX };
        }).filter(i => i.width > 0);

        let rows = [];
        let currentRow = [];
        let currentWidth = 0;

        preparedItems.forEach(item => { 
            const itemOccupancy = item.width + (currentRow.length > 0 ? MIN_SPACING : 0);
            if (currentWidth + itemOccupancy <= effectiveAvailableWidth) {
                currentRow.push(item);
                currentWidth += itemOccupancy;
            } else {
                rows.push(currentRow);
                currentRow = [item];
                currentWidth = item.width;
            }
        });
        if (currentRow.length > 0) rows.push(currentRow);

        let currentY = GALLERY_PADDING;
        rows.forEach((row) => {
            let rowMaxHeight = 0;
            row.forEach(item => { if (item.height > rowMaxHeight) rowMaxHeight = item.height; });
            let totalRowWidth = row.reduce((sum, item) => sum + item.width, 0) + (row.length - 1) * MIN_SPACING;
            let currentX = GALLERY_PADDING + (effectiveAvailableWidth - totalRowWidth) / 2;

            row.forEach(item => {
                const verticalOffset = (rowMaxHeight - item.height) / 2;
                item.div.style.position = 'absolute';
                item.div.style.top = `${currentY + verticalOffset}px`;
                item.div.style.left = `${currentX}px`;
                item.div.style.width = `${item.width}px`;
                item.div.style.height = `${item.height}px`;
                currentX += item.width + MIN_SPACING;
            });
            currentY += rowMaxHeight + MIN_SPACING;
        });
        galleryContainer.style.height = `${currentY + GALLERY_PADDING}px`;
    }

    function renderAllItems(items) {
        if (!galleryContainer) return;
        galleryContainer.innerHTML = ''; 
        allGalleryItems = []; 
        
        globalScaleFactor = calculateDynamicScale(items, galleryContainer.getBoundingClientRect().width);
        const DECADES = [...new Set(items.map(item => item.DECADE))].filter(d => d).sort();

        items.forEach(itemData => {
            const { heightCM, widthCM } = dimensionCMToNumbers(itemData['DIMSENSIONS (CM)']);
            if (heightCM > 0 && widthCM > 0) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                itemDiv.dataset.decade = itemData.DECADE;
                itemDiv.dataset.widthCm = widthCM;
                itemDiv.dataset.heightCm = heightCM;

                const img = document.createElement('img');
                img.src = itemData['MEDIA URL'];
                img.loading = 'lazy'; 
                itemDiv.appendChild(img);
                itemDiv.addEventListener('click', () => openModal(itemData));
                allGalleryItems.push(itemDiv);
                galleryContainer.appendChild(itemDiv);
            }
        });
        positionGalleryItems(allGalleryItems);
        return DECADES;
    }
    
    function initFilterControls(decadesArray) {
        if (!filterControls) return;
        filterControls.innerHTML = ''; 
        const allButton = document.createElement('button');
        allButton.className = 'filter-button active-filter';
        allButton.textContent = 'ALL';
        allButton.dataset.decade = 'ALL';
        allButton.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active-filter'));
            allButton.classList.add('active-filter');
            filterGallery('ALL');
        });
        filterControls.appendChild(allButton);
        decadesArray.forEach(decade => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.textContent = decade;
            button.dataset.decade = decade;
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active-filter'));
                button.classList.add('active-filter');
                filterGallery(decade);
            });
            filterControls.appendChild(button);
        });
    }
    
    function filterGallery(decade) {
        const itemsToPosition = [];
        allGalleryItems.forEach(itemDiv => {
            const isMatch = (decade === 'ALL' || itemDiv.dataset.decade === decade);
            itemDiv.classList.toggle('filtered', !isMatch);
            if(isMatch) itemsToPosition.push(itemDiv);
        });
        positionGalleryItems(itemsToPosition);
    }

    // --- LOGICA DEL MODAL MEJORADA ---

    function openModal(itemData) {
        if (!modal) return;
        
        const { heightCM, widthCM } = dimensionCMToNumbers(itemData['DIMSENSIONS (CM)']);
        
        // 1. Determinar Referencia y Texto
        const isMiniature = itemData.TYPE && itemData.TYPE.toLowerCase().includes('miniature');
        const refHeightCM = isMiniature ? COIN_DIAMETER_CM : PERSON_HEIGHT_CM;
        const refLabelText = isMiniature ? "2.4 cm" : "170 cm"; // Tooltip text
        
        const refSVG = isMiniature 
            ? `<svg viewBox="0 0 100 100" style="width:100%; height:100%;"><circle cx="50" cy="50" r="48" fill="#e0e0e0" stroke="#999" stroke-width="2"/><text x="50" y="55" font-size="25" text-anchor="middle" fill="#777">25¢</text></svg>` 
            : `<svg viewBox="0 0 100 300" preserveAspectRatio="xMidYMax meet" style="width:100%; height:100%;"><circle cx="50" cy="30" r="20" fill="#333"/><rect x="20" y="60" width="60" height="140" fill="#333"/><rect x="30" y="200" width="15" height="90" fill="#333"/><rect x="55" y="200" width="15" height="90" fill="#333"/></svg>`; 

        const imgContainer = document.getElementById('modal-image-container');
        imgContainer.innerHTML = `<img id="modal-main-img" src="${itemData['MEDIA URL']}">`;
        const mainImg = document.getElementById('modal-main-img');

        // 2. Crear contenedor de referencia con etiqueta
        const refContainer = document.createElement('div');
        refContainer.className = 'ref-object-container';
        refContainer.innerHTML = `
            <div class="ref-svg-wrapper" style="width: 100%; height: 100%; flex:1;">${refSVG}</div>
            <div class="ref-label">${refLabelText}</div>
        `;
        
        // Limpiar referencias anteriores
        const oldRefs = modalVisualContent.querySelectorAll('.ref-object-container');
        oldRefs.forEach(el => el.remove());
        
        modalVisualContent.appendChild(refContainer); 

        // 3. Info Box
        const existingInfo = modal.querySelector('.modal-info-container');
        if (existingInfo) existingInfo.remove();

        const infoContainer = document.createElement('div');
        infoContainer.className = 'modal-info-container';
        
        const widthIn = (widthCM * CM_TO_INCH).toFixed(1);
        const heightIn = (heightCM * CM_TO_INCH).toFixed(1);
        const displayDim = isMetric 
            ? `${heightCM.toFixed(1)} x ${widthCM.toFixed(1)} cm`
            : `${heightIn} x ${widthIn} in`;

        // Botón Scale oculto para miniaturas
        const scaleBtnStyle = isMiniature ? 'display: none;' : '';

        infoContainer.innerHTML = `
            <h3 class="modal-info-title">${itemData.NAME}</h3>
            <p class="modal-info-details">
                ${itemData.DATE}<br>${itemData.TYPE}<br><strong>${displayDim}</strong>
            </p>
            <div class="modal-controls">
                <button id="btn-actual" class="modal-btn active">Actual Size</button>
                <button id="btn-scale" class="modal-btn" style="${scaleBtnStyle}">Scale</button>
                <button id="btn-compare" class="modal-btn">Compare</button>
            </div>
            <div id="scale-feedback" class="scale-feedback">Scale: 100%</div>
        `;
        modal.appendChild(infoContainer);

        const feedbackEl = document.getElementById('scale-feedback');

        // 4. Lógica de Escalado Sincronizado
        function setScale(mode) {
            let finalScaleFactor = 1; // 1 = 100% Actual Size

            if (mode === 'actual') {
                // Escala "Real" basada en DPI promedio
                finalScaleFactor = 1; // Lógica base es scale * MODAL_CM_SCALE
                
                const wPx = widthCM * MODAL_CM_SCALE;
                const hPx = heightCM * MODAL_CM_SCALE;
                const refHPx = refHeightCM * MODAL_CM_SCALE;

                mainImg.style.width = `${wPx}px`;
                mainImg.style.height = `${hPx}px`;
                
                // Referencia sigue a la imagen
                refContainer.style.height = `${refHPx}px`;
                refContainer.style.width = isMiniature ? `${refHPx}px` : `${refHPx * 0.3}px`; // Aspect ratio aprox

                feedbackEl.textContent = "Scale: 100% (Actual Size)";

            } else if (mode === 'fit') {
                // Ajustar a la ventana (85%)
                const winW = window.innerWidth * 0.85;
                const winH = window.innerHeight * 0.85;
                const scaleX = winW / widthCM;
                const scaleY = winH / heightCM;
                
                // Pixeles por CM calculados para encajar
                const fitPxPerCm = Math.min(scaleX, scaleY); 
                
                const wPx = widthCM * fitPxPerCm;
                const hPx = heightCM * fitPxPerCm;
                const refHPx = refHeightCM * fitPxPerCm;

                mainImg.style.width = `${wPx}px`;
                mainImg.style.height = `${hPx}px`;
                
                refContainer.style.height = `${refHPx}px`;
                refContainer.style.width = isMiniature ? `${refHPx}px` : `${refHPx * 0.3}px`;

                // Calcular porcentaje relativo al tamaño real
                const percentage = Math.round((fitPxPerCm / MODAL_CM_SCALE) * 100);
                feedbackEl.textContent = `Scale: ${percentage}% (Fit to Screen)`;
            }
        }

        // Estado Inicial
        setScale('actual');

        const btnActual = document.getElementById('btn-actual');
        const btnScale = document.getElementById('btn-scale');
        const btnCompare = document.getElementById('btn-compare');

        btnActual.addEventListener('click', () => {
            btnActual.classList.add('active');
            if(btnScale) btnScale.classList.remove('active');
            setScale('actual');
        });

        if(btnScale) {
            btnScale.addEventListener('click', () => {
                btnScale.classList.add('active');
                btnActual.classList.remove('active');
                setScale('fit');
            });
        }

        btnCompare.addEventListener('click', () => {
            btnCompare.classList.toggle('active');
            refContainer.classList.toggle('visible');
        });

        modal.style.display = 'flex'; // Flex para centrar
        
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (e) => { 
            // Cerrar solo si clic en el fondo oscuro (modal), no en el contenido
            if (e.target === modal || e.target.id === 'modal-scroll-wrapper') { 
                modal.style.display = 'none'; 
            } 
        };
    }

    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            allArtworkData = results.data.filter(item => item['MEDIA URL'] && item['DIMSENSIONS (CM)']);
            if (allArtworkData.length === 0) return;
            
            allArtworkData = sortData(allArtworkData);

            setupEditorialSection(allArtworkData); 
            setupImageMarquee(allArtworkData);

            const DECADES = renderAllItems(allArtworkData); 
            initFilterControls(DECADES); 
            
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (filterControls && galleryContainer) {
                        renderAllItems(allArtworkData);
                        const activeBtn = filterControls.querySelector('.active-filter');
                        if(activeBtn) filterGallery(activeBtn.dataset.decade);
                    }
                }, 250); 
            });
        }
    });
});