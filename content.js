// content.js
(function() {
    'use strict';

    let isEnabled = true; // Par défaut activé

    // Fonction pour charger l'état depuis storage
    function loadThemeState() {
        chrome.storage.sync.get(['themeEnabled'], function(result) {
            // Si la valeur n'existe pas, elle sera undefined, donc on garde true par défaut
            isEnabled = result.themeEnabled !== false;
            applyThemeState();
            console.log(`%c🔧 Theme ${isEnabled ? 'activé' : 'désactivé'} (état chargé)`, 'background: #CE6B39; color: #191A1C; padding: 2px 4px; border-radius: 3px;');
        });
    }

    // Fonction pour appliquer l'état du theme
    function applyThemeState() {
        const htmlElement = document.documentElement;

        if (isEnabled) {
            htmlElement.classList.add('omnivox-theme-active');
            // Appliquer les styles spécifiques à l'URL
            applyStylesBasedOnUrl();
        } else {
            htmlElement.classList.remove('omnivox-theme-active');
            // Retirer toutes les classes de style spécifiques
            const classesToRemove = [];
            htmlElement.classList.forEach(className => {
                if (className.startsWith('omnivox-') && className !== 'omnivox-theme-active') {
                    classesToRemove.push(className);
                }
            });
            classesToRemove.forEach(className => htmlElement.classList.remove(className));
        }
    }

    // Fonction pour ajouter une classe à l'élément HTML en fonction de l'URL
    function applyStylesBasedOnUrl() {
        if (!isEnabled) return; // Ne pas appliquer si désactivé

        const url = window.location.href;
        const htmlElement = document.documentElement;

        // Retirer toutes les classes de style spécifiques existantes
        const classesToRemove = [];
        htmlElement.classList.forEach(className => {
            if (className.startsWith('omnivox-') && className !== 'omnivox-theme-active') {
                classesToRemove.push(className);
            }
        });
        classesToRemove.forEach(className => htmlElement.classList.remove(className));

        // Mapping des URLs aux classes
        const urlMappings = [
            { prefix: 'https://climoilou.omnivox.ca/intr/', className: 'omnivox-intr-active', log: '🎨 Styles appliqués : Accueil (intr)' },
            { prefix: 'https://climoilou.omnivox.ca/Login/Account/', className: 'omnivox-login-active', log: '🔑 Styles appliqués : Page de login' },
            { prefix: 'https://climoilou-lea.omnivox.ca/', className: 'omnivox-lea-active', log: '📚 Styles appliqués : Léa' },
            { prefix: 'https://climoilou-lea.omnivox.ca/cvir/dtrv/DepotTravail.aspx', className: 'omnivox-depot-active', log: '📤 Styles appliqués : Dépôt de travail' },
            { prefix: 'https://climoilou.omnivox.ca/apps/mfa/login', className: 'omnivox-mfa-active', log: '🔐 Styles appliqués : 2FA' },
            { prefix: 'https://climoilou-estd.omnivox.ca/', className: 'omnivox-estd-active', log: '📊 Styles appliqués : ESTD' },
            { prefix: 'https://climoilou.omnivox.ca/WebApplication/Module.MIOE/', className: 'omnivox-mio-active', log: '✉️ Styles appliqués : MIO' },
            { prefix: 'https://climoilou.omnivox.ca/cvir/note', className: 'omnivox-note-active', log: '✉️ Styles appliqués : Notes' }
        ];

        // Trouver et appliquer la première classe correspondante
        let applied = false;
        for (const mapping of urlMappings) {
            if (url.startsWith(mapping.prefix)) {
                htmlElement.classList.add(mapping.className);
                console.log(`%c${mapping.log}`, 'background: #CE6B39; color: #191A1C; font-weight: bold; padding: 2px 4px; border-radius: 3px;');
                applied = true;
                break;
            }
        }

        if (!applied) {
            console.log('%cℹ️ Aucun style spécifique appliqué pour cette URL', 'color: #a9b4c4;');
        }
    }

    // Écouter les messages du popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'toggleTheme') {
            isEnabled = request.enabled;
            applyThemeState();
            console.log(`%c🔧 Theme ${isEnabled ? 'activé' : 'désactivé'} (changement manuel)`, 'background: #CE6B39; color: #191A1C; padding: 2px 4px; border-radius: 3px;');
            sendResponse({success: true});
        }
    });

    // Appliquer au chargement initial (immédiat car run_at: document_start)
    loadThemeState();

    // Observer les changements d'URL pour les SPA (Single Page Applications)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            if (isEnabled) {
                applyStylesBasedOnUrl();
            }
        }
    }).observe(document, { subtree: true, childList: true });

    // Appliquer également aux iframes
    function initIframes() {
        if (!isEnabled) return;

        const iframes = document.getElementsByTagName('iframe');
        for (let iframe of iframes) {
            try {
                if (iframe.contentDocument || iframe.contentWindow) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc.readyState === 'complete') {
                        applyStylesToIframe(iframeDoc);
                    } else {
                        iframeDoc.addEventListener('DOMContentLoaded', () => applyStylesToIframe(iframeDoc));
                    }
                }
            } catch (e) {
                // Erreur CORS, on ignore
            }
        }
    }

    function applyStylesToIframe(iframeDoc) {
        if (!isEnabled) return;

        const url = iframeDoc.location.href;
        const htmlElement = iframeDoc.documentElement;

        // S'assurer que la classe theme-active est présente
        htmlElement.classList.add('omnivox-theme-active');

        const urlMappings = [
            { prefix: 'https://climoilou.omnivox.ca/intr/', className: 'omnivox-intr-active' },
            { prefix: 'https://climoilou.omnivox.ca/Login/Account/', className: 'omnivox-login-active' },
            { prefix: 'https://climoilou-lea.omnivox.ca/', className: 'omnivox-lea-active' },
            { prefix: 'https://climoilou-lea.omnivox.ca/cvir/dtrv/DepotTravail.aspx', className: 'omnivox-depot-active' },
            { prefix: 'https://climoilou.omnivox.ca/apps/mfa/login', className: 'omnivox-mfa-active' },
            { prefix: 'https://climoilou-estd.omnivox.ca/', className: 'omnivox-estd-active' },
            { prefix: 'https://climoilou.omnivox.ca/WebApplication/Module.MIOE/', className: 'omnivox-mio-active' },
            { prefix: 'https://climoilou.omnivox.ca/cvir/note', className: 'omnivox-note-active' }
        ];

        const classesToRemove = [];
        htmlElement.classList.forEach(className => {
            if (className.startsWith('omnivox-') && className !== 'omnivox-theme-active') {
                classesToRemove.push(className);
            }
        });
        classesToRemove.forEach(className => htmlElement.classList.remove(className));

        for (const mapping of urlMappings) {
            if (url.startsWith(mapping.prefix)) {
                htmlElement.classList.add(mapping.className);
                console.log(`%c🖼️ [iframe] Style appliqué: ${mapping.className}`, 'background: #483d66; color: #e6ebf2; padding: 2px 4px; border-radius: 3px;');
                break;
            }
        }
    }

    // Observer l'ajout de nouvelles iframes
    const iframeObserver = new MutationObserver((mutations) => {
        if (!isEnabled) return;

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'IFRAME') {
                    try {
                        if (node.contentDocument || node.contentWindow) {
                            const iframeDoc = node.contentDocument || node.contentWindow.document;
                            if (iframeDoc.readyState === 'complete') {
                                applyStylesToIframe(iframeDoc);
                            } else {
                                iframeDoc.addEventListener('DOMContentLoaded', () => applyStylesToIframe(iframeDoc));
                            }
                        }
                    } catch (e) {
                        // Erreur CORS, on ignore
                    }
                }
            }
        }
    });

    if (document.body) {
        iframeObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            iframeObserver.observe(document.body, { childList: true, subtree: true });
        });
    }

    // Initialiser les iframes existantes
    if (document.readyState === 'complete') {
        initIframes();
    } else {
        document.addEventListener('DOMContentLoaded', initIframes);
    }

})();