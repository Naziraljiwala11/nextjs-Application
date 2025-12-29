import React from "react";
import Script from "next/script";
import { notFound } from "next/navigation";

// Dynamic Data Fetcher (Replaces hardcoded logic)
async function getPageData(slugArray: string[]) {
    try {
        if (!slugArray || slugArray.length === 0) return null;
        const slug = slugArray[slugArray.length - 1]; // Use the last segment as the slug
        console.log(`Fetching data from WP for slug: ${slug}`);

        // 1. Fetch Page Data from WordPress REST API
        // We use ?slug=... to find the page. 
        const apiRes = await fetch(
            `https://fnpresswire.contentmanagement.se/wp-json/wp/v2/pages?slug=${slug}`,
            { next: { revalidate: 60 } }
        );

        if (!apiRes.ok) return null;

        const pages = await apiRes.json();
        if (!pages || pages.length === 0) return null; // 404

        const pageData = pages[0]; // Take the first match
        const liveUrl = pageData.link; // usage: "https://fnpresswire.../about-us/"

        // 2. Headless Bridge: Fetch live HTML to scrape Assets
        // This ensures pixel-perfect styling match
        const livePageRes = await fetch(liveUrl, { next: { revalidate: 60 } });
        const liveHtml = await livePageRes.text();

        // 3. Extract Stylesheets
        const styleRegex = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>|<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g;
        const styles = [];
        let styleMatch;
        while ((styleMatch = styleRegex.exec(liveHtml)) !== null) {
            const href = styleMatch[1] || styleMatch[2];
            if (href) styles.push(href);
        }

        // 4. Extract Critical Inline Styles
        const inlineStyleRegex = /<style[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/style>/g;
        const inlineStyles = [];
        let inlineMatch;
        const relevantStyleIds = [
            'global-styles-inline-css',
            'elementor-frontend-inline-css',
            'elementor-global-css',
            'wp-custom-css',
        ];

        while ((inlineMatch = inlineStyleRegex.exec(liveHtml)) !== null) {
            const id = inlineMatch[1];
            const content = inlineMatch[2];
            // Capture Global styles + Elementor/Theme styles + Post-Specific styles (e.g. elementor-post-628)
            if (relevantStyleIds.includes(id) || id.includes('elementor') || id.includes('wp-')) {
                inlineStyles.push(content);
            }
        }

        // 5. Extract Scripts
        const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/g;
        const scripts = [];
        let scriptMatch;
        while ((scriptMatch = scriptRegex.exec(liveHtml)) !== null) {
            const src = scriptMatch[1];
            if (src && (src.includes('wp-content') || src.includes('wp-includes'))) {
                scripts.push(src);
            }
        }

        // 6. Extract Body Classes
        const bodyClassRegex = /<body[^>]*class=["']([^"']+)["'][^>]*>/;
        const bodyClassMatch = liveHtml.match(bodyClassRegex);
        const bodyClasses = bodyClassMatch ? bodyClassMatch[1] : "elementor-default elementor-page";

        return {
            content: pageData.content.rendered,
            title: pageData.title.rendered,
            styles: [...new Set(styles)],
            inlineStyles: [...new Set(inlineStyles)],
            scripts: [...new Set(scripts)],
            bodyClasses
        };

    } catch (e) {
        console.error("Error fetching page data:", e);
        return null; // Trigger 404
    }
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    const data = await getPageData(slug);

    if (!data) return notFound();

    return (
        <>
            <title>{data.title}</title>

            {/* Inject External Stylesheets */}
            {data.styles.map((href, index) => (
                <link key={`ext-${index}`} rel="stylesheet" href={href} />
            ))}

            {/* Inject Inline Styles */}
            {data.inlineStyles.map((css, index) => (
                <style key={`inline-${index}`} dangerouslySetInnerHTML={{ __html: css }} />
            ))}

            {/* Scoped Body Wrapper for Elementor Styles */}
            <div className={data.bodyClasses}>
                <div
                    dangerouslySetInnerHTML={{ __html: data.content }}
                    className={`elementor-page`}
                />
            </div>

            {/* Load Essential Scripts */}
            {data.scripts.map((src, index) => (
                <Script
                    key={index}
                    src={src}
                    strategy="lazyOnload"
                />
            ))}
        </>
    );
}
