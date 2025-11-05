import crypto from 'crypto'

const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+={[}]|\\:;"\'<,>.?/';

export function generateRandomString(length: number): string {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters[randomIndex];
    }
    return result;
}

export function generateStrongPassword(length: number = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_+={[}]|\\:;"\'<,>.?/';

    // Ensure at least one character from each category
    let password = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Fill remaining characters randomly from all sets
    const allChars = upper + lower + numbers + symbols;
    for (let i = password.length; i < length; i++) {
        password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Shuffle the password to remove predictable pattern
    return password.sort(() => Math.random() - 0.5).join('');
}

export function generateNumericCode(length = 6) {
    if (!Number.isInteger(length) || length < 6) {
        throw new Error("length must be an integer >= 6");
    }

    // maxExclusive = 10^length
    const maxExclusive = 10 ** length;

    // crypto.randomInt is secure and returns integer in [0, maxExclusive)
    const n = crypto.randomInt(0, maxExclusive);

    // pad with leading zeros if needed
    return String(n).padStart(length, "0");
}
