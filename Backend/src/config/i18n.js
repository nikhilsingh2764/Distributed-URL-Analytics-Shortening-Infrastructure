import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        fallbackLng: "en",
        supportedLngs: ["en", "hi"],
        nonExplicitSupportedLngs: true, // en-US -> en, hi-IN -> hi
        preload: ["en", "hi"],
        backend: {
            loadPath: path.join(__dirname, "../locales/{{lng}}/translation.json"),
        },
        detection: {
            order: ["header"],
            lookupHeader: "accept-language",
        },
        interpolation: { escapeValue: false },
    });

export default i18next;
