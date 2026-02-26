/**
 * Nexura Protection Layer
 * Defensive scripts to deter unauthorized inspection and copying.
 */
(function () {
    if (localStorage.getItem('nexura_debug') === 'true') return;
    // Disable right-click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Disable keyboard shortcuts for DevTools
    document.addEventListener('keydown', e => {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });

    // Simple DevTools detection trap
    // This triggers a debugger pause if DevTools are open, making inspection annoying
    setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            // Potential DevTools open detected due to debugger pause
            console.clear();
            console.log("%cNexura System Protection", "color: #6366f1; font-size: 20px; font-weight: bold;");
            console.log("L'accès aux outils de développement est restreint.");
        }
    }, 2000);
})();
