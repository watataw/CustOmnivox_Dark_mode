// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('themeToggle');
    const statusText = document.getElementById('statusText');
    const colorCustomization = document.getElementById('colorCustomization');
    const toggleColorsBtn = document.getElementById('toggleColorsBtn');
    const arrowIcon = toggleColorsBtn.querySelector('.arrow-icon');
    const applyColorsBtn = document.getElementById('applyColorsBtn');
    const successMessage = document.getElementById('successMessage');
    const colorGrid = document.getElementById('colorGrid');

    // Couleurs par défaut
    const defaultColors = {
        'primary-background-color': '#191A1C',
        'secondary-background-color': '#26282B',
        'important-background-color': '#483d66',
        'primary-text-color': '#e6ebf2',
        'secondary-text-color': '#a9b4c4',
        'important-text-color': '#CE6B39',
        'text-muted': '#6f7d91'
    };

    // Noms conviviaux pour l'affichage
    const colorNames = {
        'primary-background-color': 'Fond principal',
        'secondary-background-color': 'Fond secondaire',
        'important-background-color': 'Fond important',
        'primary-text-color': 'Texte principal',
        'secondary-text-color': 'Texte secondaire',
        'important-text-color': 'Texte important',
        'text-muted': 'Texte discret'
    };

    // Stockage des couleurs actuelles
    let currentColors = {};

    // Charger l'état du thème et les couleurs
    chrome.storage.sync.get(['themeEnabled', 'themeColors'], function(result) {
        // État du thème
        const isEnabled = result.themeEnabled !== false;
        toggleSwitch.checked = isEnabled;
        updateStatusText(isEnabled);

        // Couleurs personnalisées ou par défaut
        currentColors = result.themeColors || {...defaultColors};
        generateColorInputs(currentColors);
    });

    // Mettre à jour le texte de statut
    function updateStatusText(enabled) {
        statusText.textContent = enabled ? 'Activé' : 'Désactivé';
        statusText.style.color = enabled ? '#CE6B39' : '#a9b4c4';
    }

    // Générer les champs de couleur avec bouton reset individuel
    function generateColorInputs(colors) {
        colorGrid.innerHTML = '';

        Object.keys(defaultColors).forEach(key => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';

            const label = document.createElement('span');
            label.className = 'color-label';
            label.textContent = colorNames[key] || key;

            const input = document.createElement('input');
            input.type = 'color';
            input.className = 'color-input';
            input.id = `color-${key}`;
            input.value = colors[key] || defaultColors[key];

            const valueSpan = document.createElement('span');
            valueSpan.className = 'color-value';
            valueSpan.textContent = input.value;

            // Bouton reset individuel
            const resetBtn = document.createElement('button');
            resetBtn.className = 'btn-reset-small';
            resetBtn.title = 'Reset à la couleur par défaut';
            resetBtn.innerHTML = '↺';
            resetBtn.style.cssText = `
                background: transparent;
                border: 1px solid #483d66;
                color: #CE6B39;
                border-radius: 4px;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            `;

            // Hover effect
            resetBtn.addEventListener('mouseenter', () => {
                resetBtn.style.backgroundColor = 'rgba(206, 107, 57, 0.1)';
                resetBtn.style.borderColor = '#CE6B39';
            });
            resetBtn.addEventListener('mouseleave', () => {
                resetBtn.style.backgroundColor = 'transparent';
                resetBtn.style.borderColor = '#483d66';
            });

            // Action de reset individuel
            resetBtn.addEventListener('click', function() {
                const defaultValue = defaultColors[key];
                input.value = defaultValue;
                valueSpan.textContent = defaultValue;

                // Mettre à jour currentColors
                currentColors[key] = defaultValue;

                // Sauvegarder dans le storage
                chrome.storage.sync.set({ themeColors: currentColors });

                // Appliquer immédiatement le changement en temps réel
                applyColorsToTabs(currentColors);

                // Afficher un petit message de confirmation
                showResetConfirmation(resetBtn);
            });

            // Mettre à jour l'affichage hex quand la couleur change
            input.addEventListener('input', function() {
                valueSpan.textContent = this.value;
                currentColors[key] = this.value;

                // Appliquer immédiatement en temps réel pendant le glissement
                applyColorsToTabs(currentColors);
            });

            colorItem.appendChild(label);
            colorItem.appendChild(input);
            colorItem.appendChild(valueSpan);
            colorItem.appendChild(resetBtn);

            colorGrid.appendChild(colorItem);
        });
    }

    // Afficher une confirmation temporaire pour le reset
    function showResetConfirmation(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '✓';
        button.style.color = '#4CAF50';
        button.style.borderColor = '#4CAF50';

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.color = '#CE6B39';
            button.style.borderColor = '#483d66';
        }, 1000);
    }

    // Fonction pour appliquer les couleurs aux onglets
    function applyColorsToTabs(colors) {
        chrome.tabs.query({url: "https://*.omnivox.ca/*"}, function(tabs) {
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateColors',
                    colors: colors
                }).catch(() => {
                    // Ignorer les erreurs
                });
            });
        });
    }

    // Récupérer les couleurs actuelles du formulaire
    function getCurrentColors() {
        const colors = {};
        Object.keys(defaultColors).forEach(key => {
            const input = document.getElementById(`color-${key}`);
            if (input) {
                colors[key] = input.value;
            }
        });
        return colors;
    }

    // Afficher un message de succès temporaire
    function showSuccessMessage() {
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 2000);
    }

    // Toggle la section des couleurs
    toggleColorsBtn.addEventListener('click', function() {
        const isHidden = colorCustomization.style.display === 'none';
        colorCustomization.style.display = isHidden ? 'block' : 'none';
        arrowIcon.classList.toggle('rotated', isHidden);
    });

    // Appliquer les couleurs avec le bouton Appliquer
    applyColorsBtn.addEventListener('click', function() {
        const colors = getCurrentColors();
        currentColors = colors;

        // Sauvegarder dans le storage
        chrome.storage.sync.set({ themeColors: colors }, function() {
            console.log('Couleurs sauvegardées');
        });

        // Appliquer aux onglets en temps réel
        applyColorsToTabs(colors);
        showSuccessMessage();
    });

    // Écouter les changements du toggle
    toggleSwitch.addEventListener('change', function() {
        const isEnabled = toggleSwitch.checked;

        chrome.storage.sync.set({ themeEnabled: isEnabled }, function() {
            console.log('Theme ' + (isEnabled ? 'activé' : 'désactivé'));
        });

        chrome.tabs.query({url: "https://*.omnivox.ca/*"}, function(tabs) {
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleTheme',
                    enabled: isEnabled
                }).catch(() => {});
            });
        });

        updateStatusText(isEnabled);
    });
});