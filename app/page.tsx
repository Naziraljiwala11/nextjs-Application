import React from "react";
import Script from "next/script";
import { notFound } from "next/navigation";

// Dynamic Data Fetcher (Replaces hardcoded logic)
async function getHomePageData() {
  try {
    const slug = 'home';
    console.log(`Fetching data from WP for homepage (slug: ${slug})`);

    // 1. Fetch Page Data from WordPress REST API
    const apiRes = await fetch(
      `https://fnpresswire.contentmanagement.se/wp-json/wp/v2/pages?slug=${slug}`,
      { next: { revalidate: 60 } }
    );

    if (!apiRes.ok) return null;

    const pages = await apiRes.json();
    if (!pages || pages.length === 0) return null; // 404

    const pageData = pages[0];
    const liveUrl = pageData.link; // Should be https://fnpresswire.../

    // 2. Headless Bridge: Fetch live HTML to scrape Assets
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
      if (relevantStyleIds.includes(id) || id.includes('elementor') || id.includes('wp-')) {
        inlineStyles.push(content);
      }
    }

    // 5. Extract External Scripts
    const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/g;
    const scripts = [];
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(liveHtml)) !== null) {
      const src = scriptMatch[1];
      if (src && (src.includes('wp-content') || src.includes('wp-includes'))) {
        scripts.push(src);
      }
    }

    // 6. Extract Inline Scripts (Critical for Elementor Config)
    // Elementor stores config in inline scripts, usually assigning to 'var elementorFrontendConfig'
    const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    const inlineScripts = [];
    let inlineScriptMatch;
    while ((inlineScriptMatch = inlineScriptRegex.exec(liveHtml)) !== null) {
      const content = inlineScriptMatch[1];
      if (content.includes('elementorFrontendConfig') || content.includes('elementor-frontend')) {
        inlineScripts.push(content);
      }
    }

    // 7. Extract Body Classes
    const bodyClassRegex = /<body[^>]*class=["']([^"']+)["'][^>]*>/;
    const bodyClassMatch = bodyClassRegex.exec(liveHtml);
    const bodyClasses = bodyClassMatch ? bodyClassMatch[1] : "elementor-default elementor-page";

    return {
      content: pageData.content.rendered,
      title: pageData.title.rendered,
      styles: [...new Set(styles)],
      inlineStyles: [...new Set(inlineStyles)],
      scripts: [...new Set(scripts)],
      inlineScripts: [...new Set(inlineScripts)],
      bodyClasses
    };

  } catch (e) {
    console.error("Error fetching homepage data:", e);
    return null;
  }
}

export default async function Home() {
  const data = await getHomePageData();

  if (!data) return <div className="p-20 text-center">Loading Homepage Failed...</div>;

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

      {/* Load Inline Scripts (Config) */}
      {data.inlineScripts.map((script, index) => (
        <Script
          key={`inline-script-${index}`}
          id={`inline-script-${index}`}
          dangerouslySetInnerHTML={{ __html: script }}
          strategy="afterInteractive"
        />
      ))}

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
