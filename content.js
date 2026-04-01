(function() {
    'use strict';

    let isEnabled = true;
    let themeColors = null;


    const urlMappings = [
        { test: url => url.includes('/intr/'), className: 'omnivox-intr-active', log: '🎨 Accueil' },
        { test: url => url.includes('/Login/Account/'), className: 'omnivox-login-active', log: '🔑 Login' },
        { test: url => url.includes('-lea.omnivox.ca'), className: 'omnivox-lea-active', log: '📚 Léa' },
        { test: url => url.includes('/cvir/dtrv/DepotTravail.aspx'), className: 'omnivox-depot-active', log: '📤 Dépôt' },
        { test: url => url.includes('/apps/mfa/login'), className: 'omnivox-mfa-active', log: '🔐 2FA' },
        { test: url => url.includes('-estd.omnivox.ca'), className: 'omnivox-estd-active', log: '📊 ESTD' },
        { test: url => url.includes('/WebApplication/Module.MIOE/'), className: 'omnivox-mio-active', log: '✉️ MIO' },
        { test: url => url.includes('/cvir/note'), className: 'omnivox-note-active', log: '📝 Notes' }
    ];

    function isOmnivox(url) {
        try {
            const hostname = new URL(url).hostname;
            return /\.omnivox\.ca$/.test(hostname);
        } catch {
            return false;
        }
    }


    function applyCustomColors(root) {
        if (!themeColors) return;

        Object.entries(themeColors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }


    function applyStyles(doc, url) {
        if (!isEnabled || !isOmnivox(url)) return;

        const html = doc.documentElement;

        // reset classes
        [...html.classList]
            .filter(c => c.startsWith('omnivox-'))
            .forEach(c => html.classList.remove(c));

        html.classList.add('omnivox-theme-active');

        applyCustomColors(html);

        let applied = false;

        for (const mapping of urlMappings) {
            if (mapping.test(url)) {
                html.classList.add(mapping.className);
                console.log(`%c${mapping.log}`, 'background:#CE6B39;color:#191A1C;padding:2px 4px;border-radius:3px;');
                applied = true;
                break;
            }
        }

        if (!applied) {
            console.log('%cℹ️ Aucun style spécifique', 'color:#a9b4c4;');
        }
    }


    function applyThemeState() {
        const html = document.documentElement;

        [...html.classList]
            .filter(c => c.startsWith('omnivox-'))
            .forEach(c => html.classList.remove(c));

        if (isEnabled) {
            applyStyles(document, window.location.href);
        }
    }

    function loadThemeState() {
        chrome.storage.sync.get(['themeEnabled', 'themeColors'], (res) => {
            isEnabled = res.themeEnabled !== false;
            themeColors = res.themeColors || null;

            applyThemeState();
        });
    }

    let lastUrl = location.href;

    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            applyThemeState();
        }
    }).observe(document, { subtree: true, childList: true });


    function handleIframe(iframe) {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            const apply = () => {
                applyStyles(doc, doc.location.href);
            };

            if (doc.readyState === 'complete') {
                apply();
            } else {
                doc.addEventListener('DOMContentLoaded', apply);
            }
        } catch {
            // CORS ignore
        }
    }

    function initIframes() {
        document.querySelectorAll('iframe').forEach(handleIframe);
    }
    function updateAllIframes() {
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;

                if (!isEnabled) {
                    [...doc.documentElement.classList]
                        .filter(c => c.startsWith('omnivox-'))
                        .forEach(c => doc.documentElement.classList.remove(c));
                } else {
                    applyStyles(doc, doc.location.href);
                }
            } catch {}
        });
    }


    new MutationObserver((mutations) => {
        if (!isEnabled) return;

        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.tagName === 'IFRAME') {
                    handleIframe(node);
                }
            });
        });
    }).observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });


    chrome.runtime.onMessage.addListener((req, _, sendResponse) => {
        if (req.action === 'toggleTheme') {
            isEnabled = req.enabled;
            applyThemeState();
            updateAllIframes(); // 🔥 IMPORTANT
        }

        if (req.action === 'updateColors') {
            themeColors = req.colors;
            applyThemeState();
            updateAllIframes(); // 🔥 IMPORTANT
        }

        sendResponse({ success: true });
    });




    loadThemeState();

    if (document.readyState === 'complete') {
        initIframes();
    } else {
        document.addEventListener('DOMContentLoaded', initIframes);
    }

})();