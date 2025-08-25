import { getStorage, setStorage, Defaults } from "../storageHelper/storageHelper.js"
(function initFallbackRulesUI() {
    const BACKENDS = [
        { key: 'shazam', label: 'Shazam' },
        { key: 'audd', label: 'Audd' },
        { key: 'acr', label: 'ACRCloud' },
        { key: 'tencent', label: 'Tencent' },
    ];

    const defaultFallbackRules = Defaults.fallbackRules

    const container = document.getElementById('fallbackRulesContainer');
    const addBtn = document.getElementById('addFallbackRule');
    const resetBtn = document.getElementById('resetFallbackRules');

    if (!container || !addBtn || !resetBtn) return;

    function sortNumericAsc(a, b) { return Number(a) - Number(b); }

    function ensureUniqueDuration(targetValue, existingValues, step = 100) {
        let v = Number(targetValue);
        const seen = new Set(existingValues.map(Number));
        while (seen.has(v)) v += step;
        return v;
    }

    async function loadRules() {
        const stored = await getStorage("fallbackRules")
        // Validate and normalize
        const rulesObj = (stored && typeof stored === 'object') ? stored : defaultFallbackRules;
        return rulesObj;
    }

    function saveRulesFromDom() {
        const ruleCards = container.querySelectorAll('.fallback-rule-card');
        const result = {};
        ruleCards.forEach(card => {
            const durInput = card.querySelector('.fallback-duration-input');
            const list = card.querySelector('.fallback-backends-list');
            if (!durInput || !list) return;
            const duration = Number(durInput.value);
            const ordered = Array.from(list.querySelectorAll('[data-backend][data-included="true"]'))
                .map(el => el.getAttribute('data-backend'));
            if (duration && ordered.length > 0) {
                result[duration] = ordered;
            }
        });
        setStorage("fallbackRules", result)
    }

    function renderRules(rulesObj) {
        container.innerHTML = '';
        const durations = Object.keys(rulesObj).sort(sortNumericAsc);
        durations.forEach(dur => {
            const backends = Array.isArray(rulesObj[dur]) ? rulesObj[dur] : [];
            container.appendChild(createRuleCard(Number(dur), backends));
        });
    }

    function createRuleCard(duration, includedBackends) {
        const card = document.createElement('div');
        card.className = 'card fallback-rule-card';

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        // Header
        const title = document.createElement('span');
        title.className = 'card-title';
        title.textContent = 'Rule';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-flat right';
        deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
        deleteBtn.title = 'Delete rule';
        deleteBtn.addEventListener('click', () => {
            // prevent deleting the last rule
            const allRuleCards = container.querySelectorAll('.fallback-rule-card');
            if (allRuleCards.length <= 1) {
                if (window.M && M.toast) {
                    M.toast({ html: 'At least one fallback rule must exist' });
                }
                return;
            }
            card.remove();
            saveRulesFromDom();
        });

        // Duration input
        const durationRow = document.createElement('div');
        durationRow.className = 'row';
        const durationField = document.createElement('div');
        durationField.className = 'input-field col s12';
        const durationInput = document.createElement('input');
        durationInput.type = 'number';
        durationInput.className = 'fallback-duration-input';
        durationInput.min = '1000';
        durationInput.step = '100';
        durationInput.value = String(duration);
        const durationLabel = document.createElement('label');
        durationLabel.className = 'active';
        durationLabel.textContent = 'Recording length (ms)';
        durationField.appendChild(durationInput);
        durationField.appendChild(durationLabel);

        durationRow.appendChild(durationField);

        // Single interactive list: click to enable/disable, drag to reorder
        const listLabel = document.createElement('div');
        listLabel.textContent = 'Backends: click to enable/disable; drag to reorder (enabled only)';
        listLabel.style.margin = '8px 0 4px';

        const list = document.createElement('div');
        list.className = 'fallback-backends-list';
        list.style.display = 'flex';
        list.style.flexWrap = 'wrap';
        list.style.gap = '8px';

        // Drag state for this rule list
        let draggingKey = null;
        let draggingEl = null;
        let isDragging = false;

        function insertDraggedRelativeTo(targetChip, clientX) {
            if (!draggingEl || draggingEl === targetChip) return;
            const rect = targetChip.getBoundingClientRect();
            const insertAfter = clientX > rect.left + rect.width / 2;
            if (insertAfter) {
                list.insertBefore(draggingEl, targetChip.nextSibling);
            } else {
                list.insertBefore(draggingEl, targetChip);
            }
        }

        function insertDraggedAtNearest(clientX, clientY) {
            const enabledChips = Array.from(list.querySelectorAll('.chip[data-included="true"]'));
            if (enabledChips.length === 0 || !draggingEl) return;
            let closest = null;
            let minDelta = Infinity;
            enabledChips.forEach(ch => {
                if (ch === draggingEl) return;
                const r = ch.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const dx = cx - clientX;
                const dy = cy - clientY;
                const delta = Math.hypot(dx, dy);
                if (delta < minDelta) {
                    minDelta = delta;
                    closest = ch;
                }
            });
            if (closest) insertDraggedRelativeTo(closest, clientX);
        }

        // Build chips for all backends
        const chipsByKey = {};
        BACKENDS.forEach(b => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.textContent = b.label;
            chip.setAttribute('data-backend', b.key);
            const isIncluded = includedBackends.includes(b.key);
            chip.setAttribute('data-included', isIncluded ? 'true' : 'false');
            chip.classList.toggle('blue', isIncluded);
            chip.classList.toggle('lighten-4', isIncluded);
            chip.classList.toggle('grey', !isIncluded);
            chip.classList.toggle('lighten-2', !isIncluded);
            chip.draggable = isIncluded;

            // Toggle include on click (suppressed when dragging)
            chip.addEventListener('click', (e) => {
                if (isDragging) return; // avoid click after a drag
                const currentlyIncluded = chip.getAttribute('data-included') === 'true';
                if (currentlyIncluded) {
                    // prevent disabling the last enabled backend
                    const enabledChipsNow = Array.from(list.querySelectorAll('.chip[data-included="true"]'));
                    if (enabledChipsNow.length <= 1) {
                        if (window.M && M.toast) {
                            M.toast({ html: 'At least one backend must be enabled' });
                        }
                        return;
                    }
                    chip.setAttribute('data-included', 'false');
                    chip.classList.remove('blue', 'lighten-4');
                    chip.classList.add('grey', 'lighten-2');
                    chip.draggable = false;
                } else {
                    chip.setAttribute('data-included', 'true');
                    chip.classList.remove('grey', 'lighten-2');
                    chip.classList.add('blue', 'lighten-4');
                    chip.draggable = true;
                    // move next to the last enabled chip to keep enabled group together
                    const enabledChips = Array.from(list.querySelectorAll('.chip[data-included="true"]'));
                    if (enabledChips.length > 0) {
                        const lastEnabled = enabledChips[enabledChips.length - 1];
                        list.insertBefore(chip, lastEnabled.nextSibling);
                    } else {
                        list.insertBefore(chip, list.firstChild);
                    }
                }
                saveRulesFromDom();
            });

            // Drag behavior (only meaningful when included)
            chip.addEventListener('dragstart', (e) => {
                if (chip.getAttribute('data-included') !== 'true') return;
                draggingKey = b.key;
                draggingEl = chip;
                isDragging = true;
                chip.classList.add('is-dragging');
                e.dataTransfer.setData('text/plain', b.key);
                e.dataTransfer.effectAllowed = 'move';
                // Improve drag image to follow cursor
                try { e.dataTransfer.setDragImage(chip, Math.floor(chip.offsetWidth/2), Math.floor(chip.offsetHeight/2)); } catch {}
            });
            chip.addEventListener('dragover', (e) => {
                if (chip.getAttribute('data-included') !== 'true') return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                chip.classList.add('drag-over');
                insertDraggedRelativeTo(chip, e.clientX);
            });
            chip.addEventListener('dragenter', () => {
                if (chip.getAttribute('data-included') !== 'true') return;
                chip.classList.add('drag-over');
            });
            chip.addEventListener('dragleave', () => {
                chip.classList.remove('drag-over');
            });
            chip.addEventListener('dragend', () => {
                chip.classList.remove('drag-over');
                chip.classList.remove('is-dragging');
                setTimeout(() => { isDragging = false; draggingKey = null; draggingEl = null; }, 0);
                saveRulesFromDom();
            });
            chip.addEventListener('drop', (e) => {
                if (chip.getAttribute('data-included') !== 'true') return;
                e.preventDefault();
                chip.classList.remove('drag-over');
                insertDraggedRelativeTo(chip, e.clientX);
                setTimeout(() => { isDragging = false; draggingKey = null; draggingEl = null; }, 0);
                saveRulesFromDom();
            });

            chipsByKey[b.key] = chip;
        });

        // Append enabled chips in provided order, then disabled ones
        includedBackends.forEach(k => {
            if (chipsByKey[k]) list.appendChild(chipsByKey[k]);
        });
        BACKENDS.forEach(b => {
            if (!includedBackends.includes(b.key)) list.appendChild(chipsByKey[b.key]);
        });

        // Allow drop at the end of the enabled group or between using container
        list.addEventListener('dragover', (e) => {
            if (!isDragging || !draggingEl) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            insertDraggedAtNearest(e.clientX, e.clientY);
        });
        list.addEventListener('drop', (e) => {
            if (!isDragging || !draggingEl) return;
            e.preventDefault();
            insertDraggedAtNearest(e.clientX, e.clientY);
            setTimeout(() => { isDragging = false; draggingKey = null; draggingEl = null; }, 0);
            saveRulesFromDom();
        });

        // Events
        durationInput.addEventListener('change', () => {
            const otherValues = Array.from(container.querySelectorAll('.fallback-duration-input'))
                .filter(inp => inp !== durationInput)
                .map(inp => Number(inp.value));
            const unique = ensureUniqueDuration(durationInput.value, otherValues);
            if (unique !== Number(durationInput.value)) {
                durationInput.value = String(unique);
                if (window.M && M.toast) {
                    M.toast({ html: 'Adjusted to unique duration: ' + unique });
                }
            }
            saveRulesFromDom();
        });

        cardContent.appendChild(title);
        cardContent.appendChild(deleteBtn);
        cardContent.appendChild(durationRow);
        cardContent.appendChild(listLabel);
        cardContent.appendChild(list);

        card.appendChild(cardContent);
        return card;
    }

    async function init() {
        const rules = await loadRules();
        renderRules(rules);
    }

    addBtn.addEventListener('click', () => {
        // Determine a suggested duration
        const existing = Array.from(container.querySelectorAll('.fallback-duration-input')).map(i => Number(i.value));
        const base = existing.length ? Math.max(...existing) + 1500 : 3500;
        const unique = ensureUniqueDuration(base, existing);
        const card = createRuleCard(unique, ['shazam']);
        container.appendChild(card);
        saveRulesFromDom();
        // Focus new input
        const input = card.querySelector('.fallback-duration-input');
        input && input.focus();
    });

    resetBtn.addEventListener('click', async () => {
        await setStorage("fallbackRules", defaultFallbackRules)
        renderRules(defaultFallbackRules);
        if (window.M && M.toast) {
            M.toast({ html: 'Fallback rules reset to default' });
        }
    });

    init();
})();