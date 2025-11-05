import sanitizeHtmlLib from "sanitize-html";

export function sanitizeHtml(dirtyHtml: string): string {
    return sanitizeHtmlLib(dirtyHtml, {
        allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat(['img']),
        allowedAttributes: {
            ...sanitizeHtmlLib.defaults.allowedAttributes,
            'img': ['src', 'alt', 'title', 'width', 'height'],
        }
    });
}