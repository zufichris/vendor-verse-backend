export const slugify = (str: string): string => {
    const slug = str
        .trim() // Remove leading/trailing whitespace
        .replace(/\s+/g, '-') // Replace one or more whitespace chars with single hyphen
        .replace(/[*+~.()'"!:@]/g, '') // Remove special characters
        .toLowerCase();
    return slug;
};