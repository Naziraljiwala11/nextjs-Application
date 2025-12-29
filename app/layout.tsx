import { Providers } from "../components/Providers";
import "./globals.css";
import { getGlobalLayoutData } from "../lib/layout-service";
import Script from "next/script";

// We won't use the hardcoded Header/Footer anymore.
// We also don't forcibly load DM Sans via Next Font, as Elementor manages fonts via its own CSS.

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const layoutData = await getGlobalLayoutData();
  const bodyClass = layoutData?.bodyClass || "elementor-default elementor-kit-26";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {layoutData?.styles.map((href, i) => (
          <link key={`global-css-${i}`} rel="stylesheet" href={href} />
        ))}
        {layoutData?.inlineStyles.map((css, index) => (
          <style key={`global-inline-${index}`} dangerouslySetInnerHTML={{ __html: css }} />
        ))}
      </head>
      <body className={`bg-white ${bodyClass}`}>
        <Providers>

          {/* Dynamic Header */}
          {layoutData?.headerHtml ? (
            <div dangerouslySetInnerHTML={{ __html: layoutData.headerHtml }} />
          ) : (
            <div className="p-4 bg-gray-100 text-center">Header Loading Failed</div>
          )}

          <main className="min-h-screen">
            {children}
          </main>

          {/* Dynamic Footer */}
          {layoutData?.footerHtml ? (
            <div dangerouslySetInnerHTML={{ __html: layoutData.footerHtml }} />
          ) : (
            <div className="p-4 bg-gray-100 text-center">Footer Loading Failed</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
