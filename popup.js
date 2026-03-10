// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('themeToggle');
    const statusText = document.getElementById('statusText');

    // Charger l'état actuel depuis le storage
    chrome.storage.sync.get(['themeEnabled'], function(result) {
        // Par défaut activé (true) si aucune valeur n'est définie
        const isEnabled = result.themeEnabled !== false;
        toggleSwitch.checked = isEnabled;
        updateStatusText(isEnabled);
    });

    // Mettre à jour le texte de statut
    function updateStatusText(enabled) {
        statusText.textContent = enabled ? 'Activé' : 'Désactivé';
        statusText.style.color = enabled ? '#CE6B39' : '#a9b4c4';
    }

    // Écouter les changements du toggle
    toggleSwitch.addEventListener('change', function() {
        const isEnabled = toggleSwitch.checked;

        // Sauvegarder dans le storage
        chrome.storage.sync.set({ themeEnabled: isEnabled }, function() {
            console.log('Theme ' + (isEnabled ? 'activé' : 'désactivé'));
        });

        // Envoyer un message à tous les onglets Omnivox ouverts
        chrome.tabs.query({url: "https://*.omnivox.ca/*"}, function(tabs) {
            tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleTheme',
                    enabled: isEnabled
                }).catch(() => {
                    // Ignorer les erreurs (onglet pas encore prêt, etc.)
                });
            });
        });

        updateStatusText(isEnabled);
    });
});