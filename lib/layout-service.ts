import React from "react";

// Helper to extract a balanced HTML tag block (handles nested divs)
function extractBalancedTag(html: string, startString: string): string | null {
    const startIndex = html.indexOf(startString);
    if (startIndex === -1) return null;

    let depth = 0;
    let currentIndex = startIndex;
    const maxIndex = html.length;

    // Scan forward from start
    while (currentIndex < maxIndex) {
        // Simple state machine: very basic parser
        // Note: this is fragile if attributes contain strings with <div, but usually sufficient for Elementor markup
        if (html.startsWith('<div', currentIndex)) {
            depth++;
            currentIndex += 4;
        } else if (html.startsWith('</div>', currentIndex)) {
            depth--;
            currentIndex += 6;
            if (depth === 0) {
                // Found the matching closing tag
                return html.substring(startIndex, currentIndex);
            }
        } else {
            currentIndex++;
        }
    }
    return null;
}

export async function getGlobalLayoutData() {
    try {
        const liveRes = await fetch("https://fnpresswire.contentmanagement.se/", { next: { revalidate: 3600 } });
        const liveHtml = await liveRes.text();

        // 1. Extract Header
        // Identifying string from inspection: <div data-elementor-type="header"
        // Note: Inspection showed specific class order too, but data-elementor-type is robust.
        const headerHtml = extractBalancedTag(liveHtml, '<div data-elementor-type="header"');

        // 2. Extract Footer
        // Identifying string: <div data-elementor-type="footer"
        const footerHtml = extractBalancedTag(liveHtml, '<div data-elementor-type="footer"');

        // 3. Extract Styles (Same logic but focused on globals)
        // We need: Global colors/fonts/kit-26, Header css (post-27), Footer css (post-369)
        const styleRegex = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>|<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g;
        const styles = [];
        let styleMatch;
        while ((styleMatch = styleRegex.exec(liveHtml)) !== null) {
            const href = styleMatch[1] || styleMatch[2];
            // Push everything, duplicates handled later
            if (href) styles.push(href);
        }

        // Inline Styles
        const inlineStyleRegex = /<style[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/style>/g;
        const inlineStyles = [];
        let inlineMatch;
        const relevantStyleIds = [
            'global-styles-inline-css',
            'elementor-frontend-inline-css',
            'elementor-global-css',
            'wp-custom-css',
            'elementor-post-26',  // Global Kit
            'elementor-post-27',  // Header
            'elementor-post-369', // Footer
            'hello-elementor-header-footer'
        ];

        while ((inlineMatch = inlineStyleRegex.exec(liveHtml)) !== null) {
            const id = inlineMatch[1];
            const content = inlineMatch[2];
            if (relevantStyleIds.includes(id) || id.includes('elementor')) {
                inlineStyles.push(content);
            }
        }

        // Body Class (Essential for Kit-26 scoping)
        const bodyClass = "elementor-kit-26";

        return {
            headerHtml: headerHtml || "<div class='p-4 text-center'>Header fetching failed</div>",
            footerHtml: footerHtml || "<div class='p-4 text-center'>Footer fetching failed</div>",
            styles: [...new Set(styles)],
            inlineStyles: [...new Set(inlineStyles)],
            bodyClass
        };

    } catch (e) {
        console.error("Error fetching global layout:", e);
        return null;
    }
}
