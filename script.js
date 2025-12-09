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
    const CM_TO_FEET = 0.0328084;
    const CM_TO_YARD = 0.0109361;
    const CM_TO_METER = 0.01; // 1cm = 0.01m
    const CM_TO_PX = MODAL_CM_SCALE; // 1cm = 37.8px
    
    // Referencias (CM)
    const PERSON_HEIGHT_CM = 170; 
    const COIN_DIAMETER_CM = 2.42; 

    const csvFilePath = 'Database.csv';
    let allArtworkData = []; 
    let allGalleryItems = []; 
    let globalScaleFactor = 0; 
    let currentUnit = 'in'; // unidad predeterminada: inches

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

    function formatDimension(heightCM, widthCM, unit) {
        let h, w, unitLabel;
        switch(unit) {
            case 'in':
                h = (heightCM * CM_TO_INCH).toFixed(1);
                w = (widthCM * CM_TO_INCH).toFixed(1);
                unitLabel = 'in';
                break;
            case 'ft':
                h = (heightCM * CM_TO_FEET).toFixed(2);
                w = (widthCM * CM_TO_FEET).toFixed(2);
                unitLabel = 'ft';
                break;
            case 'yd':
                h = (heightCM * CM_TO_YARD).toFixed(2);
                w = (widthCM * CM_TO_YARD).toFixed(2);
                unitLabel = 'yd';
                break;
            case 'm':
                h = (heightCM * CM_TO_METER).toFixed(2);
                w = (widthCM * CM_TO_METER).toFixed(2);
                unitLabel = 'm';
                break;
            case 'px':
                h = Math.round(heightCM * CM_TO_PX);
                w = Math.round(widthCM * CM_TO_PX);
                unitLabel = 'px';
                break;
            default: // cm
                h = heightCM.toFixed(1);
                w = widthCM.toFixed(1);
                unitLabel = 'cm';
        }
        return `${h} x ${w} ${unitLabel}`;
    }

    function updateEditorialText() {
        if (largestArtworkNameSpan && largestArtworkMeasureSpan) {
            largestArtworkNameSpan.textContent = 'Helen Brought to Paris';
            largestArtworkMeasureSpan.textContent = formatDimension(143.3, 198.4, currentUnit);
        }
        if (smallestArtworkNameSpan && smallestArtworkMeasureSpan) {
            smallestArtworkNameSpan.textContent = 'Eye of a Lady';
            smallestArtworkMeasureSpan.textContent = formatDimension(1.5, 1.8, currentUnit);
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
        const dropdown = document.getElementById('unit-dropdown');
        
        // Toggle dropdown al hacer clic en el botón
        unitToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });

        // Manejar selección de opciones
        dropdown.querySelectorAll('.unit-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                

                dropdown.querySelectorAll('.unit-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                

                currentUnit = option.dataset.unit;
                

                unitToggleBtn.innerHTML = `
                    MEASUREMENTS
                    <svg width="10" height="10" viewBox="0 0 10 10" style="margin-left: 8px; vertical-align: middle;">
                        <line x1="2" y1="3" x2="5" y2="6" stroke="#0011ff" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="5" y1="6" x2="8" y2="3" stroke="#0011ff" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                `;
                

                updateEditorialText();
                updateOpenModalUnits();
                

                dropdown.classList.remove('show');
            });
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
        const isMiniature = itemData.TYPE && itemData.TYPE.toLowerCase().includes('miniature');
        
        modal.dataset.heightCm = heightCM;
        modal.dataset.widthCm  = widthCM;
        modal.dataset.isMiniature = isMiniature ? 'true' : 'false';

        const refHeightCM = isMiniature ? COIN_DIAMETER_CM : PERSON_HEIGHT_CM;
        const refSVGPath = isMiniature ? 'coin.svg' : 'person.svg';

        function getRefLabelText() {
            const refCM = isMiniature ? COIN_DIAMETER_CM : PERSON_HEIGHT_CM;
            let refValue, refUnit;
            switch(currentUnit) {
                case 'in':
                    refValue = (refCM * CM_TO_INCH).toFixed(2);
                    refUnit = 'in';
                    break;
                case 'ft':
                    refValue = (refCM * CM_TO_FEET).toFixed(2);
                    refUnit = 'ft';
                    break;
                case 'yd':
                    refValue = (refCM * CM_TO_YARD).toFixed(2);
                    refUnit = 'yd';
                    break;
                case 'm':
                    refValue = (refCM * CM_TO_METER).toFixed(2);
                    refUnit = 'm';
                    break;
                case 'px':
                    refValue = Math.round(refCM * CM_TO_PX);
                    refUnit = 'px';
                    break;
                default:
                    refValue = refCM.toFixed(2);
                    refUnit = 'cm';
            }
            return `${refValue} ${refUnit}`;
        }

        const imgContainer = document.getElementById('modal-image-container');
        imgContainer.innerHTML = `<img id="modal-main-img" src="${itemData['MEDIA URL']}" alt="${itemData.NAME}">`;
        const mainImg = document.getElementById('modal-main-img');

        const refContainer = document.createElement('div');
        refContainer.className = 'ref-object-container ' + (isMiniature ? 'coin-ref' : 'person-ref');
        refContainer.innerHTML = `
            <div class="ref-svg-wrapper">
                <img src="${refSVGPath}" style="width:100%;height:100%;object-fit:contain;" alt="Reference object">
                <div class="ref-label-hover">${getRefLabelText()}</div>
            </div>
        `;
        imgContainer.querySelectorAll('.ref-object-container').forEach(el => el.remove());
        imgContainer.appendChild(refContainer);

        const oldInfo = modal.querySelector('.modal-info-container');
        if (oldInfo) oldInfo.remove();
        const infoContainer = document.createElement('div');
        infoContainer.className = 'modal-info-container';
        const displayDim = formatDimension(heightCM, widthCM, currentUnit);
        infoContainer.innerHTML = `
            <h3 class="modal-info-title">${itemData.NAME}</h3>
            <p class="modal-info-details">
                ${itemData.DATE || ''}<br>${itemData.TYPE || ''}<br><strong id="modal-dims">${displayDim}</strong>
            </p>
            <p class="modal-info-reference" id="modal-ref-dims" style="display:none;">
                Reference: ${getRefLabelText()}
            </p>
            <div style="position: relative; width: max-content; margin-top: 15px;">
                <button id="modal-unit-toggle-btn" class="unit-toggle-btn" style="margin-top: 0;">
                    MEASUREMENTS
                    <svg width="10" height="10" viewBox="0 0 10 10" style="margin-left: 8px; vertical-align: middle;">
                        <line x1="2" y1="3" x2="5" y2="6" stroke="#0011ff" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="5" y1="6" x2="8" y2="3" stroke="#0011ff" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
                <div id="modal-unit-dropdown" class="unit-dropdown">
                    <div class="unit-option ${currentUnit === 'in' ? 'active' : ''}" data-unit="in">INCHES (IN)</div>
                    <div class="unit-option ${currentUnit === 'cm' ? 'active' : ''}" data-unit="cm">CENTIMETERS (CM)</div>
                    <div class="unit-option ${currentUnit === 'm' ? 'active' : ''}" data-unit="m">METERS (M)</div>
                    <div class="unit-option ${currentUnit === 'ft' ? 'active' : ''}" data-unit="ft">FEET (FT)</div>
                    <div class="unit-option ${currentUnit === 'yd' ? 'active' : ''}" data-unit="yd">YARDS (YD)</div>
                    <div class="unit-option ${currentUnit === 'px' ? 'active' : ''}" data-unit="px">PIXELS (PX)</div>
                </div>
            </div>
            <div class="modal-controls">
                <button id="btn-actual" class="modal-btn active">Actual Size</button>
                <button id="btn-scale" class="modal-btn">Scale</button>
                <button id="btn-compare" class="modal-btn">Compare</button>
            </div>
            <div id="scale-feedback" class="scale-feedback">Scale: 100%</div>
        `;
        modal.appendChild(infoContainer); 
        

        const modalUnitBtn = document.getElementById('modal-unit-toggle-btn');
        const modalUnitDropdown = document.getElementById('modal-unit-dropdown');
        modalUnitDropdown.style.height = '100px'; 
        modalUnitDropdown.style.overflow = 'auto';
        modalUnitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modalUnitDropdown.classList.toggle('show');

        });
        
        modalUnitDropdown.querySelectorAll('.unit-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                modalUnitDropdown.querySelectorAll('.unit-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentUnit = option.dataset.unit;
                updateOpenModalUnits();
                modalUnitDropdown.classList.remove('show');
            });
        });
        
        let feedbackEl = document.getElementById('scale-feedback');
        const svgWrapper = refContainer.querySelector('.ref-svg-wrapper');
        let currentMode = 'actual';
        let currentPxPerCm = MODAL_CM_SCALE;
        let compareActive = false;
        const PERSON_ASPECT = 3972.52 / 5052.87;

        function applyReferenceScale(pxPerCm) {
            const refDimsSpan = document.getElementById('modal-ref-dims');
            const effectiveCompare = compareActive && (!isMiniature || currentMode === 'actual');
            if (!effectiveCompare) {
                refContainer.classList.remove('visible', 'compare-side-by-side');
                if (refDimsSpan) refDimsSpan.style.display = 'none';
                return;
            }
            refContainer.classList.add('visible');
            if (refDimsSpan) refDimsSpan.style.display = 'block';
            
            const refHeightPx = (isMiniature ? COIN_DIAMETER_CM : PERSON_HEIGHT_CM) * pxPerCm;
            const refWidthPx = isMiniature ? refHeightPx : refHeightPx * PERSON_ASPECT;
            svgWrapper.style.height = `${refHeightPx}px`;
            svgWrapper.style.width = `${refWidthPx}px`;

            if (isMiniature) {
                // Side-by-side with miniature
                refContainer.classList.add('compare-side-by-side');
                refContainer.style.position = 'relative';
                refContainer.style.top = '';
                refContainer.style.left = '';
                refContainer.style.bottom = '';
                refContainer.style.transform = '';
                refContainer.style.zIndex = '';
            } else {
                // Person overlay centered
                refContainer.classList.remove('compare-side-by-side');
                refContainer.style.position = 'fixed';
                refContainer.style.top = '50%';
                refContainer.style.left = '50%';
                refContainer.style.transform = 'translate(-50%, -50%)';
                refContainer.style.bottom = '';
                refContainer.style.zIndex = '105';
            }
        }
        function centerInViewport() {
            const scrollWrapper = document.getElementById('modal-scroll-wrapper');
            const scrollTop = Math.max(0, (mainImg.offsetHeight - scrollWrapper.clientHeight) / 2);
            scrollWrapper.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
        function computePixelsPerCm(mode) {
            if (compareActive && !isMiniature) {

                const scrollWrapper = document.getElementById('modal-scroll-wrapper');
                const styles = window.getComputedStyle(scrollWrapper);
                const padTop = parseFloat(styles.paddingTop) || 0;
                const padBottom = parseFloat(styles.paddingBottom) || 0;
                const availableH = window.innerHeight - padTop - padBottom;


                let basePxPerCm = (availableH * 0.85) / PERSON_HEIGHT_CM;


                const limitByPainting = (availableH - 20) / heightCM;
                const limitByPerson   = (availableH - 20) / PERSON_HEIGHT_CM;
                return Math.min(basePxPerCm, limitByPainting, limitByPerson);
            }
            if (mode === 'actual') return MODAL_CM_SCALE;
            const winW = window.innerWidth * 0.85;
            const winH = window.innerHeight * 0.85;
            return Math.min(winW / widthCM, winH / heightCM);
        }

        function setScale(mode) {
            currentMode = mode;
            currentPxPerCm = computePixelsPerCm(mode);
            const wPx = widthCM * currentPxPerCm;
            const hPx = heightCM * currentPxPerCm;

            const scrollWrapper = document.getElementById('modal-scroll-wrapper');
            if (scrollWrapper) {
                scrollWrapper.classList.toggle('fit-center', isMiniature || mode !== 'actual');
                scrollWrapper.classList.toggle('compare-center', isMiniature && compareActive && mode === 'actual');
            }

            mainImg.style.width = `${wPx}px`;
            mainImg.style.height = `${hPx}px`;

            const visualContent = document.getElementById('modal-visual-content');
            if (visualContent) {
                visualContent.style.width = `${wPx}px`;
                visualContent.style.height = `${hPx}px`;
                visualContent.classList.toggle('compare-side-by-side', isMiniature && compareActive && mode === 'actual');
            }

            if (feedbackEl) {
                if (compareActive && !isMiniature) {
                    const relativePct = Math.round((currentPxPerCm / MODAL_CM_SCALE) * 100);
                    feedbackEl.textContent = `Scale: Person reference (adjusted, ${relativePct}%)`;
                } else if (mode === 'actual') {
                    feedbackEl.textContent = 'Scale: 100% (Actual Size)';
                } else {
                    const pct = Math.round((currentPxPerCm / MODAL_CM_SCALE) * 100);
                    feedbackEl.textContent = `Scale: ${pct}% (Fit to Screen)`;
                }
            }

            applyReferenceScale(currentPxPerCm);

            setTimeout(() => {
                if (!scrollWrapper) return;
                if (isMiniature) {
                    const scrollTop = Math.max(0, (mainImg.offsetHeight - scrollWrapper.clientHeight) / 2);
                    scrollWrapper.scrollTo({ top: scrollTop, behavior: 'smooth' });
                } else {
                    scrollWrapper.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        }

        setScale('actual');

        const btnActual = document.getElementById('btn-actual');
        const btnScale  = document.getElementById('btn-scale');
        const btnCompare = document.getElementById('btn-compare');

        btnActual.onclick = () => {
            btnActual.classList.add('active');
            btnScale.classList.remove('active');
            setScale('actual');
        };
        btnScale.onclick = () => {
            btnScale.classList.add('active');
            btnActual.classList.remove('active');
            setScale('fit');
        };
        btnCompare.onclick = () => {
            const turningOn = !compareActive;
            if (turningOn && isMiniature && currentMode !== 'actual') {
                btnActual.classList.add('active');
                btnScale.classList.remove('active');
                currentMode = 'actual';
            }
            compareActive = !compareActive;
            btnCompare.classList.toggle('active', compareActive);
            
            if (!compareActive) {
                refContainer.classList.remove('compare-side-by-side');
                refContainer.style.position = 'absolute';
                refContainer.style.bottom = '10px';
                refContainer.style.top = '';
                refContainer.style.left = '50%';
                refContainer.style.transform = 'translateX(-50%)';
                refContainer.style.zIndex = '';
            }
            setScale(currentMode);
        };

        window.addEventListener('resize', () => {
            if (modal.style.display === 'flex') {
                setScale(currentMode);
            }
        });

        modal.style.display = 'flex';
        const closeButton = modal.querySelector('.close-button');
        

        closeButton.onclick = () => { 
            modal.style.display = 'none'; 
        };
        

        modal.onclick = (e) => {
            if (e.target === modal || e.target.id === 'modal-scroll-wrapper') {
                modal.style.display = 'none';
            }
        };
        

        const handleEscape = (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    function updateOpenModalUnits() {
        if (!modal || modal.style.display !== 'flex') return;
        const dimsSpan = modal.querySelector('#modal-dims');
        const refDimsSpan = modal.querySelector('#modal-ref-dims');
        const refLabelHover = modal.querySelector('.ref-label-hover');
        const heightCM = parseFloat(modal.dataset.heightCm || '0');
        const widthCM  = parseFloat(modal.dataset.widthCm || '0');
        const isMiniature = modal.dataset.isMiniature === 'true';

        if (dimsSpan) {
            dimsSpan.textContent = formatDimension(heightCM, widthCM, currentUnit);
        }
        
        const refCM = isMiniature ? COIN_DIAMETER_CM : PERSON_HEIGHT_CM;
        let refValue, refUnit;
        switch(currentUnit) {
            case 'in':
                refValue = (refCM * CM_TO_INCH).toFixed(2);
                refUnit = 'in';
                break;
            case 'ft':
                refValue = (refCM * CM_TO_FEET).toFixed(2);
                refUnit = 'ft';
                break;
            case 'yd':
                refValue = (refCM * CM_TO_YARD).toFixed(2);
                refUnit = 'yd';
                break;
            case 'm':
                refValue = (refCM * CM_TO_METER).toFixed(2);
                refUnit = 'm';
                break;
            case 'px':
                refValue = Math.round(refCM * CM_TO_PX);
                refUnit = 'px';
                break;
            default:
                refValue = refCM.toFixed(2);
                refUnit = 'cm';
        }
        const refText = `${refValue} ${refUnit}`;
        
        if (refDimsSpan) {
            refDimsSpan.textContent = `Reference: ${refText}`;
        }
        if (refLabelHover) {
            refLabelHover.textContent = refText;
        }
    }

    const favoritesContainer = document.getElementById('favorites-container');
    const favCompareBar = document.getElementById('favorites-compare-bar');
    const favSelectedCount = document.getElementById('fav-selected-count');
    const favCompareViewBtn = document.getElementById('fav-compare-view');
    const favComparisonModal = document.getElementById('fav-comparison-modal');
    const favComparisonContent = document.getElementById('fav-comparison-content');
    const favCompClose = document.getElementById('fav-comp-close');
    const favUnselectBtn = document.getElementById('fav-unselect');

    let favorites = new Set(JSON.parse(localStorage.getItem('art.scale.favorites') || '[]'));
    let favSelection = new Set(); 

    function artworkId(item) {

        return `${item.NAME || ''}__${item.DATE || ''}__${item['MEDIA URL'] || ''}`;
    }

    function saveFavorites() {
        localStorage.setItem('art.scale.favorites', JSON.stringify(Array.from(favorites)));
    }

    function addFavoritesFilterButton(/* decadesArray */) {
        if (!filterControls) return;


        let favBtn = filterControls.querySelector('button[data-decade="FAVORITES"]');
        if (!favBtn) {
            favBtn = document.createElement('button');
            favBtn.className = 'filter-button favorites-tab';
            favBtn.type = 'button';
            favBtn.dataset.decade = 'FAVORITES';
            favBtn.innerHTML = `
                <span class="filter-star-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.83 198.6" width="18" height="18">
                        <polygon points="85.49 78.92 107.2 12.05 129.4 78.92 200.25 78.92 143.12 120.81 164.82 187.69 107.61 146.88 50.32 187.7 71.77 120.81 15.14 78.92 85.49 78.92"/>
                    </svg>
                </span>
                <span>FAVORITES</span>
            `;
            favBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active-filter'));
                favBtn.classList.add('active-filter');
                showFavoritesGrid();
            });
        }


        const allBtn = filterControls.querySelector('button[data-decade="ALL"]');
        if (allBtn) {
            if (favBtn.previousElementSibling !== allBtn) {
                filterControls.insertBefore(favBtn, allBtn);
            } else {
                filterControls.insertBefore(favBtn, allBtn); 
            }

            document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active-filter'));
            allBtn.classList.add('active-filter');
            if (favoritesContainer && galleryContainer) {
                favoritesContainer.style.display = 'none';
                galleryContainer.style.display = 'block';
            }
        } else {

            filterControls.prepend(favBtn);
        }
    }

    function showFavoritesGrid() {
        if (!favoritesContainer || !galleryContainer) return;

        galleryContainer.style.display = 'none';
        favoritesContainer.style.display = 'grid';
        favoritesContainer.innerHTML = '';

        favSelection.clear();
        updateFavSelectionUI();

        const favItems = allArtworkData.filter(item => favorites.has(artworkId(item)));
        favItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'fav-item';
            card.innerHTML = `
                <img class="fav-thumb" src="${item['MEDIA URL']}" alt="${item.NAME}">
                <div class="fav-select">
                    <input type="checkbox" class="fav-checkbox">
                    <span>${item.NAME || 'Untitled'}</span>
                </div>
            `;
            const checkbox = card.querySelector('.fav-checkbox');
            checkbox.addEventListener('change', () => {
                const id = artworkId(item);
                if (checkbox.checked) {
                    if (favSelection.size >= 3) {
                        checkbox.checked = false;
                        alert('You can select up to 3 artworks.');
                        return;
                    }
                    favSelection.add(id);
                } else {
                    favSelection.delete(id);
                }
                updateFavSelectionUI();
            });
            favoritesContainer.appendChild(card);
        });
        updateFavSelectionUI();
    }

    function updateFavSelectionUI() {
        favSelectedCount.textContent = `Selected: ${favSelection.size}`;
        favCompareViewBtn.disabled = favSelection.size < 2;
        if (favSelection.size > 0) {
            favCompareBar.classList.add('active');
        } else {
            favCompareBar.classList.remove('active');
        }
    }

    function clearFavSelections() {
        favoritesContainer.querySelectorAll('.fav-checkbox').forEach(cb => { cb.checked = false; });
        favSelection.clear();
        updateFavSelectionUI();
    }

    if (favUnselectBtn) {
        favUnselectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearFavSelections();
        });
    }

    function openFavoritesComparison() {
        if (favSelection.size < 2) return;
        favComparisonModal.classList.add('active');
        favComparisonContent.innerHTML = '';

        const selectedItems = allArtworkData.filter(item => favSelection.has(artworkId(item)));
        let maxDim = 0;
        selectedItems.forEach(item => {
            const { heightCM, widthCM } = dimensionCMToNumbers(item['DIMSENSIONS (CM)']);
            maxDim = Math.max(maxDim, heightCM, widthCM);
        });
        const maxDisplayH = Math.min(window.innerHeight * 0.6, 700);
        const cmPerPx = (maxDisplayH / maxDim) * 0.8;

        selectedItems.forEach(item => {
            const { heightCM, widthCM } = dimensionCMToNumbers(item['DIMSENSIONS (CM)']);
            const dimsText = formatDimension(heightCM, widthCM, currentUnit);
            const hPx = Math.max(1, heightCM * cmPerPx);
            const wPx = Math.max(1, widthCM * cmPerPx);
            const side = document.createElement('div');
            side.className = 'fav-comp-side';
            side.dataset.heightCm = heightCM; 
            side.dataset.widthCm = widthCM;   
            const metaDiv = document.createElement('div');
            metaDiv.className = 'fav-comp-meta';
            metaDiv.style.marginTop = '10px';
            metaDiv.style.textAlign = 'center';
            metaDiv.style.fontFamily = "'Inter',sans-serif";
            metaDiv.style.color = 'var(--secondary-color)';
            metaDiv.style.fontSize = '0.85rem';
            
            const nameDiv = document.createElement('div');
            nameDiv.style.color = 'var(--primary-color)';
            nameDiv.style.fontWeight = '700';
            nameDiv.textContent = item.NAME || 'Untitled';
            
            const infoDiv = document.createElement('div');
            infoDiv.textContent = `${item.DATE || ''} • ${item.TYPE || ''}`;
            
            const dimsDiv = document.createElement('div');
            dimsDiv.className = 'fav-comp-dims';
            dimsDiv.textContent = dimsText;
            
            metaDiv.appendChild(nameDiv);
            metaDiv.appendChild(infoDiv);
            metaDiv.appendChild(dimsDiv);
            
            const img = document.createElement('img');
            img.className = 'comp-img';
            img.src = item['MEDIA URL'];
            img.alt = item.NAME;
            img.style.width = `${wPx}px`;
            img.style.height = `${hPx}px`;
            img.style.objectFit = 'contain';
            
            side.appendChild(img);
            side.appendChild(metaDiv);
            favComparisonContent.appendChild(side);
        });

        const favUnitBtn = document.getElementById('fav-unit-toggle-btn');
        const favUnitDropdown = document.getElementById('fav-unit-dropdown');
        if (favUnitBtn && favUnitDropdown) {
            favUnitDropdown.querySelectorAll('.unit-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.unit === currentUnit);
            });
            favUnitBtn.onclick = (e) => {
                e.stopPropagation();
                favUnitDropdown.classList.toggle('show');
            };
            document.addEventListener('click', () => favUnitDropdown.classList.remove('show'), { once: true });
            favUnitDropdown.querySelectorAll('.unit-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    favUnitDropdown.querySelectorAll('.unit-option').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    currentUnit = opt.dataset.unit;
                    favComparisonContent.querySelectorAll('.fav-comp-side').forEach(side => {
                        const h = parseFloat(side.dataset.heightCm || '0');
                        const w = parseFloat(side.dataset.widthCm || '0');
                        const dimEl = side.querySelector('.fav-comp-dims');
                        if (dimEl) dimEl.textContent = formatDimension(h, w, currentUnit);
                    });
                    favUnitDropdown.classList.remove('show');
                });
            });
        }
    }

    if (favCompareViewBtn) favCompareViewBtn.addEventListener('click', openFavoritesComparison);
    if (favCompClose) favCompClose.addEventListener('click', () => {
        favComparisonModal.classList.remove('active');
    });
    if (favComparisonModal) {
        favComparisonModal.addEventListener('click', (e) => {
            if (e.target === favComparisonModal) favComparisonModal.classList.remove('active');
        });
    }

    function injectStarToggle(infoContainer, itemData) {
        const controls = infoContainer.querySelector('.modal-controls');
        if (!controls) return;
        const id = artworkId(itemData);

        const starBtn = document.createElement('button');
        starBtn.className = 'modal-star-toggle';
        starBtn.type = 'button';
        starBtn.innerHTML = `
            <span class="modal-star-icon ${favorites.has(id) ? 'filled' : ''}" aria-label="Toggle favorite">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.83 198.6" width="18" height="18">
                  <polygon points="85.49 78.92 107.2 12.05 129.4 78.92 200.25 78.92 143.12 120.81 164.82 187.69 107.61 146.88 50.32 187.7 71.77 120.81 15.14 78.92 85.49 78.92"/>
                </svg>
            </span>
        `;
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (favorites.has(id)) {
                favorites.delete(id);
            } else {
                favorites.add(id);
            }
            saveFavorites();
            const icon = starBtn.querySelector('.modal-star-icon');
            icon.classList.toggle('filled', favorites.has(id));
        });
        controls.appendChild(starBtn);
    }

    const originalOpenModal = openModal;
    openModal = function(itemData) {
        originalOpenModal(itemData);
        const infoContainer = modal.querySelector('.modal-info-container');
        if (infoContainer) injectStarToggle(infoContainer, itemData);
    };

    const originalInitFilters = initFilterControls;
    initFilterControls = function(decadesArray) {
        originalInitFilters(decadesArray);
        addFavoritesFilterButton();
    };

    const originalFilterGallery = filterGallery;
    filterGallery = function(decade) {
        if (favoritesContainer && galleryContainer) {
            favoritesContainer.style.display = 'none';
            galleryContainer.style.display = 'block';
        }
        originalFilterGallery(decade);
    };

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