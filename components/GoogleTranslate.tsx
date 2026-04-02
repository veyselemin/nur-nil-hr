"use client";
import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    // Add Google Translate script
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    (window as any).googleTranslateElementInit = function () {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,tr,ar",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // Watch for new content added by React and re-trigger translation
    const observer = new MutationObserver(() => {
      const iframe = document.querySelector(".goog-te-menu-frame") as HTMLIFrameElement;
      if (iframe) return; // Already translated, skip
      const translateFrame = (window as any).google?.translate?.TranslateElement;
      if (translateFrame) {
        try {
          translateFrame.getInstance()?.showBanner();
        } catch {}
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{
        padding: "2px 4px",
      }}
    />
  );
}
