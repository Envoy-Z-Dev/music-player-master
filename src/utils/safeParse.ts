export default function safeParse<T = any>(raw?: string): T | null {
    try {
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}
