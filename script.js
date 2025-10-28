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


    const galleryContainer = document.getElementById('gallery-container');
    const filterControls = document.getElementById('filter-controls'); 
    const modal = document.getElementById('full-size-modal');
    if (modal) modal.style.display = 'none';


    const GALLERY_PADDING = 20;     
    const MIN_SPACING = 5;          
    const TARGET_ROW_COUNT = 5;     
    const MAX_DIMENSION_PX = 1200;  
    const MODAL_CM_SCALE = 37.8; 
    const CM_TO_INCH = 0.393701;
    let DECADES = []; 


    const csvFilePath = 'Database.csv';
    let allArtworkData = []; 
    let allGalleryItems = []; 
    let globalScaleFactor = 0; 


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function parseDimensions(dimString) {
        if (typeof dimString !== 'string') return null;
        const cleanedString = dimString.toLowerCase().replace(/[^0-9.x]/g, '');
        const parts = cleanedString.split('x');
        if (parts.length >= 2) {
            const h = parseFloat(parts[0]);
            const w = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                return { w_cm: w, h_cm: h }; 
            }
        }
        return null;
    }
    

    function dimensionCMToNumbers(dimText) {
        if (!dimText) return { heightCM: 0, widthCM: 0 };
        // Asume H x W
        const dimensions = dimText.toLowerCase().replace(/x/g, ' ').split(/\s+/).map(s => parseFloat(s.trim()));
        return { heightCM: dimensions[0] || 0, widthCM: dimensions[1] || 0 };
    }
    

    function sortData(data) {
        return data.sort((a, b) => {
            const dimA = dimensionCMToNumbers(a['DIMSENSIONS (CM)']); 
            const dimB = dimensionCMToNumbers(b['DIMSENSIONS (CM)']);
            const areaA = dimA.heightCM * dimA.widthCM;
            const areaB = dimB.heightCM * dimB.widthCM;
            return areaA - areaB; // Ordena de menor a mayor área
        });
    }


    function setupEditorialSection(data) {
        if (data.length === 0) return;


        const sortedData = sortData([...data]);
        const smallest = sortedData[0]; 
        const largest = sortedData[sortedData.length - 1];
        

        const countMiniatures = data.filter(item => item.TYPE && item.TYPE.toLowerCase() === 'miniature').length;
        const countPaintings = data.filter(item => item.TYPE && item.TYPE.toLowerCase() === 'painting').length;


        if (totalArtworksSpan) {
            animateCount(totalArtworksSpan, data.length);
        }
        

        if (largestArtworkNameSpan && largestArtworkMeasureSpan) {
            const { heightCM, widthCM } = dimensionCMToNumbers(largest['DIMSENSIONS (CM)']);
            const heightIN = (heightCM * CM_TO_INCH).toFixed(1);
            const widthIN = (widthCM * CM_TO_INCH).toFixed(1);


            largestArtworkNameSpan.textContent = 'Helen Brought to Paris';
            largestArtworkMeasureSpan.textContent = `56.4 x 78.1 in`;
        }
        

        if (smallestArtworkNameSpan && smallestArtworkMeasureSpan) {
            const { heightCM, widthCM } = dimensionCMToNumbers(smallest['DIMSENSIONS (CM)']);
            const heightIN = (heightCM * CM_TO_INCH).toFixed(1);
            const widthIN = (widthCM * CM_TO_INCH).toFixed(1);

            smallestArtworkNameSpan.textContent = 'Eye of a Lady';
            smallestArtworkMeasureSpan.textContent = `0.6 x 0.7 in`;
        }

        if (countMiniaturesSpan) {
            animateCount(countMiniaturesSpan, countMiniatures);
        }
        if (countPaintingsSpan) {
            animateCount(countPaintingsSpan, countPaintings);
        }
    }

    function animateCount(element, finalValue) {
        const duration = 1500; // 1.5 segundos
        const start = 0;
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            const currentValue = Math.min(finalValue, start + (finalValue - start) * (progress / duration));
            element.textContent = Math.floor(currentValue).toLocaleString('en-US'); // Usar coma para miles

            if (progress < duration) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = finalValue.toLocaleString('en-US');
            }
        };

        window.requestAnimationFrame(step);
    }
    
    function setupImageMarquee(artworkData) {
        if (!marqueeInner) return;
        
        const marqueeItems = artworkData.slice(0, 30);
        
        const createMarqueeElement = (item) => {
            const dims = parseDimensions(item['DIMSENSIONS (CM)']);
            if (!dims || !item['MEDIA URL']) return null;

            const widthPx = dims.w_cm * marqueeScaleFactor;
            const heightPx = dims.h_cm * marqueeScaleFactor;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'marquee-item';
            
            const img = document.createElement('img');
            img.src = item['MEDIA URL'];
            img.alt = item.NAME;
            img.className = 'marquee-img';
            img.style.width = `${widthPx}px`;
            img.style.height = `${heightPx}px`;
            img.loading = 'lazy';
            
            wrapper.appendChild(img);
            return wrapper;
        };

        const elements = marqueeItems.map(createMarqueeElement).filter(Boolean);
        if (elements.length > 0) {
            marqueeInner.innerHTML = ''; 
            marqueeInner.append(...elements);
            marqueeInner.append(...elements.map(el => el.cloneNode(true)));
        }
    }

    function calculateDynamicScale(data, availableWidth) {
        const sortedData = sortData([...data]); 
        const itemsToCalculate = sortedData.slice(0, Math.min(TARGET_ROW_COUNT, sortedData.length)); 
        if (itemsToCalculate.length === 0) return 2.5; 

        let totalCmWidth = 0;
        itemsToCalculate.forEach(item => {
            const { widthCM } = dimensionCMToNumbers(item['DIMSENSIONS (CM)']);
            totalCmWidth += widthCM;
        });

        const totalSpacing = (itemsToCalculate.length - 1) * MIN_SPACING;
        const effectiveAvailableWidth = availableWidth - (GALLERY_PADDING * 2);
        if (totalCmWidth === 0 || effectiveAvailableWidth <= 0) return 2.5; 

        const baseScale = (effectiveAvailableWidth - totalSpacing) / totalCmWidth; 
        const SCALE_MULTIPLIER = 1.25; 
        return baseScale * SCALE_MULTIPLIER;
    }
    
    function positionGalleryItems(itemsToPosition) {
        const dynamicScaleFactor = globalScaleFactor; 
        if (!galleryContainer) return;
        const containerRect = galleryContainer.getBoundingClientRect();
        const availableWidth = containerRect.width; 
        const effectiveAvailableWidth = availableWidth - (GALLERY_PADDING * 2);

        const preparedItems = itemsToPosition.filter(itemDiv => !itemDiv.classList.contains('filtered')).map(itemDiv => {
            const widthCM = parseFloat(itemDiv.dataset.widthCm);
            const heightCM = parseFloat(itemDiv.dataset.heightCm);
            let finalWidthPX = widthCM * dynamicScaleFactor; 
            let finalHeightPX = heightCM * dynamicScaleFactor;
            let aspectRatio = finalWidthPX / finalHeightPX;
            
            if (finalWidthPX > MAX_DIMENSION_PX || finalHeightPX > MAX_DIMENSION_PX) {
                 if (finalWidthPX > finalHeightPX) {
                     finalWidthPX = MAX_DIMENSION_PX;
                     finalHeightPX = finalWidthPX / aspectRatio;
                 } else {
                     finalHeightPX = MAX_DIMENSION_PX;
                     finalWidthPX = finalHeightPX * aspectRatio;
                 }
            }
            return { div: itemDiv, width: finalWidthPX, height: finalHeightPX, aspectRatio: aspectRatio };
        }).filter(item => item.width > 0 && item.height > 0);

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
        let totalHeight = 0;

        rows.forEach((row) => {
            if (row.length === 0) return;
            let rowMaxHeight = 0;
            row.forEach(item => { if (item.height > rowMaxHeight) rowMaxHeight = item.height; });

            let totalRowWidth = 0;
            row.forEach(item => { totalRowWidth += item.width; });
            totalRowWidth += (row.length - 1) * MIN_SPACING;
            
            const leftOffset = (effectiveAvailableWidth - totalRowWidth) / 2;
            let currentX = GALLERY_PADDING + leftOffset;

            row.forEach(item => {
                const finalWidth = item.width;
                const finalHeight = item.height;
                const verticalOffset = (rowMaxHeight - finalHeight) / 2;
                const itemTopPosition = currentY + verticalOffset;
                
                item.div.style.position = 'absolute';
                item.div.style.top = `${itemTopPosition}px`;
                item.div.style.left = `${currentX}px`;
                item.div.style.width = `${finalWidth}px`;
                item.div.style.height = `${finalHeight}px`;

                currentX += finalWidth + MIN_SPACING;
            });
            currentY += rowMaxHeight + MIN_SPACING;
        });

        totalHeight = currentY + GALLERY_PADDING;
        galleryContainer.style.height = `${totalHeight}px`;
    }

    function renderAllItems(items) {
        if (!galleryContainer) return;
        galleryContainer.innerHTML = ''; 
        allGalleryItems = []; 
        
        const availableWidth = galleryContainer.getBoundingClientRect().width;
        globalScaleFactor = calculateDynamicScale(items, availableWidth);

        
        const DECADES = [...new Set(items.map(item => item.DECADE))].filter(d => d).sort();

        items.forEach(itemData => {
            const itemDiv = createGalleryItem(itemData);
            if (itemDiv) {
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
        allButton.addEventListener('click', () => filterGallery('ALL'));
        filterControls.appendChild(allButton);

        decadesArray.forEach(decade => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.textContent = decade;
            button.dataset.decade = decade;
            button.addEventListener('click', () => filterGallery(decade));
            filterControls.appendChild(button);
        });
    }
    
    function filterGallery(decade) {
        const buttons = filterControls.querySelectorAll('.filter-button');
        buttons.forEach(button => {
            button.classList.toggle('active-filter', button.dataset.decade === decade);
        });

        const itemsToPosition = [];
        allGalleryItems.forEach(itemDiv => {
            const itemDecade = itemDiv.dataset.decade;
            const isMatch = (decade === 'ALL' || itemDecade === decade);
            itemDiv.classList.toggle('filtered', !isMatch);
            if(isMatch) {
                itemsToPosition.push(itemDiv);
            }
        });

        positionGalleryItems(itemsToPosition);
    }

    function createGalleryItem(itemData) {
        const { heightCM, widthCM } = dimensionCMToNumbers(itemData['DIMSENSIONS (CM)']);
        if (heightCM === 0 || widthCM === 0) return null;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'gallery-item';
        itemDiv.dataset.decade = itemData.DECADE;
        itemDiv.dataset.widthCm = widthCM;
        itemDiv.dataset.heightCm = heightCM;

        const img = document.createElement('img');
        img.src = itemData['MEDIA URL'];
        img.alt = itemData.NAME;
        img.loading = 'lazy'; 
        itemDiv.appendChild(img);

        itemDiv.addEventListener('click', () => openModal(itemData));
        return itemDiv;
    }
    
    function openModal(itemData) {
        if (!modal) return;
        
        const { heightCM, widthCM } = dimensionCMToNumbers(itemData['DIMSENSIONS (CM)']);
        const widthPx = widthCM * MODAL_CM_SCALE;
        const heightPx = heightCM * MODAL_CM_SCALE;
        const widthIn = (widthCM * CM_TO_INCH).toFixed(1);
        const heightIn = (heightCM * CM_TO_INCH).toFixed(1);

        const imgContainer = document.getElementById('modal-image-container');
        imgContainer.innerHTML = `<img src="${itemData['MEDIA URL']}" alt="${itemData.NAME}" style="width: ${widthPx}px; height: ${heightPx}px;">`;
        
        const oldInfo = modal.querySelector('.modal-info-container');
        if (oldInfo) oldInfo.remove();

        const infoContainer = document.createElement('div');
        infoContainer.className = 'modal-info-container';
        infoContainer.innerHTML = `
            <h3 class="modal-info-title">${itemData.NAME}</h3>
            <p class="modal-info-details">
                ${itemData.DATE} <br>
                ${itemData.TYPE} <br>
                ${heightIn} x ${widthIn} in
            </p>
        `;
        modal.appendChild(infoContainer);

        modal.style.display = 'grid'; 
        
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (event) => { 
            if (event.target === modal) { 
                modal.style.display = 'none'; 
            } 
        };
    }
    
    const toGalleryBtn = document.getElementById('to-gallery');
    if (toGalleryBtn) {
        toGalleryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('editorial-section'); 
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    

    const toGalleryInternalBtn = document.querySelector('.scroll-arrow-internal');
    if (toGalleryInternalBtn) {
        toGalleryInternalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('gallery-page'); 
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }


    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        
        complete: function(results) {
            

            allArtworkData = results.data.filter(item => 
                item['MEDIA URL'] && 
                item['DIMSENSIONS (CM)'] && 
                item['DECADE'] &&
                item['TYPE'] 
            );

            if (allArtworkData.length === 0) {
                 if (galleryContainer) {
                    galleryContainer.innerHTML = "<p style='color: var(--primary-color); text-align: center; font-size: 1.2rem; padding: 40px;'>Notice: The 'Database.csv' file was loaded, but no valid data was found...</p>";
                 }
                 return;
            }


            allArtworkData = sortData(allArtworkData);

            setupEditorialSection(allArtworkData); 

            let marqueeData = [...allArtworkData]; 
            shuffleArray(marqueeData); 
            setupImageMarquee(marqueeData);

            const DECADES = renderAllItems(allArtworkData); 
            initFilterControls(DECADES); 
            

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (filterControls && galleryContainer) {
                        const activeFilter = filterControls.querySelector('.active-filter');
                        const selectedDecade = activeFilter ? activeFilter.dataset.decade : 'ALL';
                        const availableWidth = galleryContainer.getBoundingClientRect().width;
                        globalScaleFactor = calculateDynamicScale(allArtworkData, availableWidth);
                        filterGallery(selectedDecade); 
                    }
                }, 250); 
            });
        },
        error: function(error) {
            console.error("Error loading CSV:", error);
            if (galleryContainer) {
                galleryContainer.innerHTML = `<p style='color: var(--primary-color); text-align: center; font-size: 1.2rem; padding: 40px;'>Error: Could not load 'Database.csv'...</p>`;
            }
        }
    });
});