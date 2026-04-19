(function() {
    'use strict';

    var inserted = 0;
    var loaded   = 0;
    var last_pct = 1;
    var last_ts  = 0;
    var finished = false;
    var setup_done = false;
    var css = null;
    var counterDiv = null; 

    // --- Status bar state ---
    var statusFixedDiv = null;
    var statusHoverDiv = null;
    var lastHostname = "";
    var mouseHasMoved = false;
    var lastMouseX = 0;
    var lastMouseY = 0;

    var settings;
    chrome.storage.local.get({
        color: "#FF0000",
        isRainbow: false,
        rainbow_size: 3.0,
        width: "2",
        opacity: "0.75",
        place: "top",
        smooth: "no",
        showCounter: true,
        showStatusBar: true,
        statusBarMode: "fixed",
        showThirdPartyOnly: false
    }).then((item) => {
        if (css != null) {
            setupCss(item)
        } else {
            settings = item
        }
    }, onError);

    const listenerCfg = {"once": true, "capture": true, "passive": true};

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    // --- Status bar helpers ---

    function extractHostname(src) {
        if (!src) return null;
        if (src.startsWith("data:") || src.startsWith("blob:")) return null;
        try {
            return new URL(src, location.href).hostname;
        } catch(e) {
            return null;
        }
    }

    function getNodeSrc(node) {
        if (node.src && node.src !== "") return node.src;
        if (node.href && node.href !== "") return node.href;
        return null;
    }

    function shouldShowHostname(hostname) {
        if (!hostname) return false;
        if (settings && settings.showThirdPartyOnly) {
            if (hostname === location.hostname) return false;
        }
        return true;
    }

    function updateStatusText(hostname) {
        if (!hostname) return;
        lastHostname = hostname;
        var displayText = hostname + "/\u2026";
        if (statusFixedDiv) {
            statusFixedDiv.textContent = displayText;
        }
        if (statusHoverDiv) {
            statusHoverDiv.textContent = displayText;
        }
    }

    function handleResourceForStatus(node) {
        if (!settings || !settings.showStatusBar) return;
        var src = getNodeSrc(node);
        var hostname = extractHostname(src);
        if (shouldShowHostname(hostname)) {
            updateStatusText(hostname);
        }
    }

    function onMouseMove(e) {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        mouseHasMoved = true;
        if (statusHoverDiv && !finished) {
            statusHoverDiv.style.position = "fixed";
            statusHoverDiv.style.left = (lastMouseX + 12) + "px";
            statusHoverDiv.style.top = (lastMouseY - 28) + "px";
            // Clear any anchored position properties
            statusHoverDiv.style.right = "";
            statusHoverDiv.style.bottom = "";
        }
    }

    // --- End status bar helpers ---

    let observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName == "BODY") {
                    inserted++;
                    node.addEventListener( "load", () => onLoadHandler(node), listenerCfg);
                    updateProgress();
                } else if (((node.nodeName == "SCRIPT" ||
                             node.nodeName == "VIDEO"  || node.nodeName == "IMG"    ||
                             node.nodeName == "IFRAME" || node.nodeName == "FRAME") && node.src != "" ) ||
                             (node.nodeName == "LINK" && node.rel == "stylesheet" && window.matchMedia(node.media))
                ) {
                    inserted++;
                    node.addEventListener( "error",   () => onLoadHandler(node), listenerCfg);
                    node.addEventListener( "abort",   () => onLoadHandler(node), listenerCfg);
                    node.addEventListener( "load",    () => onLoadHandler(node), listenerCfg);
                    // --- Status bar: track resource hostname (skips data:/blob: internally) ---
                    handleResourceForStatus(node);
                    updateProgress();
                }
            });
        });
    });
    window.addEventListener( "load", () => onLoadHandler(window), listenerCfg);
    observer.observe(document, {childList: true, subtree: true});

    function hexToRgbA(hex){
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length == 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= "0x" + c.join("");
            return "rgba("+[(c>>16)&255, (c>>8)&255, c&255].join(",")+",1)";
        }
        return "rgba(255,0,0,1)";
    }

    function setupCss(settings) {
        setup_done = true;
        let color = hexToRgbA(settings.color);
        let isRainbow = settings.isRainbow;
        let rainbow_size = settings.rainbow_size;
        let opacity = settings.opacity;
        let transition = ((settings.smooth == "yes") ? "right 0.5s linear, " : "");

        let cssStyles =
        `
        html:before {
            background: ${color};
            opacity: ${opacity};
            transition: ${transition} opacity 0.85s ease-out;
            position: fixed;
            content: "";
            z-index: 2147483647;
            ${settings.place}: 0;
            left: 0;
            height: ${settings.width}px;
        `;
        if(isRainbow){
            cssStyles +=
            `
                background: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3, #f30059, #ff2400);
                background-size: ${rainbow_size*100}% ${rainbow_size*100}%;

                -webkit-animation: rainbow 18s ease infinite;
                -z-animation: rainbow 18s ease infinite;
                -o-animation: rainbow 18s ease infinite;
                  animation: rainbow 18s ease infinite;}

                @-webkit-keyframes rainbow {
                    0%{background-position:0% 82%}
                    50%{background-position:100% 19%}
                    100%{background-position:0% 82%}
                }
                @-moz-keyframes rainbow {
                    0%{background-position:0% 82%}
                    50%{background-position:100% 19%}
                    100%{background-position:0% 82%}
                }
                @-o-keyframes rainbow {
                    0%{background-position:0% 82%}
                    50%{background-position:100% 19%}
                    100%{background-position:0% 82%}
                }
                @keyframes rainbow {
                    0%{background-position:0% 82%}
                    50%{background-position:100% 19%}
                    100%{background-position:0% 82%}
                }
            `;
        }
        cssStyles += `}`;
        css.appendChild(document.createTextNode(cssStyles));

        if (settings.showCounter) {
            counterDiv = document.createElement('div');
            counterDiv.setAttribute('style', `
                position: fixed;
                ${settings.place}: ${parseInt(settings.width) + 5}px;
                right: 10px;
                z-index: 2147483647;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 2px 5px;
                font-family: monospace;
                font-size: 15px;
                font-weight: bold;
                border-radius: 3px;
                opacity: ${opacity};
                transition: opacity 0.85s ease-out;
            `);
            document.body.appendChild(counterDiv);
        }

        // --- Setup status bar elements ---
        if (settings.showStatusBar) {
            var barOffset = parseInt(settings.width) + 5;
            var statusBaseStyle = `
                z-index: 2147483647;
                background: rgba(0, 0, 0, 0.72);
                color: #e0e0e0;
                padding: 2px 8px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                font-size: 12px;
                font-weight: 400;
                border-radius: 3px;
                opacity: ${opacity};
                transition: opacity 0.85s ease-out;
                white-space: nowrap;
                pointer-events: none;
                max-width: 350px;
                overflow: hidden;
                text-overflow: ellipsis;
            `;

            var mode = settings.statusBarMode || "fixed";

            // Create fixed status bar (for "fixed" and "both" modes)
            if (mode === "fixed" || mode === "both") {
                statusFixedDiv = document.createElement('div');
                statusFixedDiv.setAttribute('style',
                    `position: fixed;
                    ${settings.place}: ${barOffset}px;
                    left: 10px;
                    ${statusBaseStyle}`
                );
                document.body.appendChild(statusFixedDiv);
            }

            // Create hover status bubble (for "hover" and "both" modes)
            if (mode === "hover" || mode === "both") {
                statusHoverDiv = document.createElement('div');
                // Default to anchored position until mousemove fires
                statusHoverDiv.setAttribute('style',
                    `position: fixed;
                    ${settings.place}: ${barOffset}px;
                    left: 10px;
                    ${statusBaseStyle}`
                );
                document.body.appendChild(statusHoverDiv);

                // Attach mousemove listener
                document.addEventListener("mousemove", onMouseMove, { passive: true });
            }
        }
    }

    function updateProgress() {
        if (document.body != null && !finished) {
            if (css == null) {
                css = document.createElement('style');
                css.type = 'text/css';
                css.appendChild(document.createTextNode(`
                    html:before {
                        right: 99%;
                    }
                `));
                document.body.appendChild(css);
            }
            if (settings != null && !setup_done) {
                setupCss(settings);
            }

            const pct = 100 - (inserted - loaded) * 100 / inserted;
            const ts = Date.now()
            if (pct <= 100 && pct > last_pct && ts >= last_ts + 250) {
                last_pct = pct;
                last_ts = ts;
                const space = 100 - pct;
                css.firstChild.replaceWith(document.createTextNode(`
                    html:before {
                        right: ${space}%;
                    }
                `));
            }

            if (counterDiv) {
                counterDiv.textContent = `${loaded} / ${inserted}`;
            }
        }
    }

    function onLoadHandler(node) {
        loaded++;
        // --- Status bar: track resource hostname on load ---
        handleResourceForStatus(node);
        updateProgress()
        if (!finished && node.self == node && css != null) { 
            finished = true;
            observer.disconnect();
            
            
            css.firstChild.replaceWith(document.createTextNode(`
                html:before {
                    right: 0;
                }
            `));
            
           
            if (counterDiv) {
                counterDiv.textContent = `${loaded} / ${inserted}`;
            }

            
            setTimeout(function() {
                css.firstChild.replaceWith(document.createTextNode(`
                    html:before {
                        right: 0;
                        opacity: 0 !important;
                    }
                `));
               
                if (counterDiv) {
                    counterDiv.style.opacity = '0';
                }

                // --- Fade out status bar elements ---
                if (statusFixedDiv) {
                    statusFixedDiv.style.opacity = '0';
                }
                if (statusHoverDiv) {
                    statusHoverDiv.style.opacity = '0';
                }
            }, 150);
            
            
            setTimeout(function() {
                css.firstChild.replaceWith(document.createTextNode(`
                    html:before {
                        z-index: -2147483646;
                    }
                `));
                
                if (counterDiv) {
                    counterDiv.remove();
                }

                // --- Remove status bar elements ---
                if (statusFixedDiv) {
                    statusFixedDiv.remove();
                    statusFixedDiv = null;
                }
                if (statusHoverDiv) {
                    statusHoverDiv.remove();
                    statusHoverDiv = null;
                }
                // Remove mousemove listener
                document.removeEventListener("mousemove", onMouseMove);
            }, 850);
        }
    }

})();