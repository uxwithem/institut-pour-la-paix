const LABELS: Record<string, string> = {
	fr: 'FR',
	en: 'EN',
	es: 'ES',
};

export function languageLabel(code: string): string {
	return LABELS[code] ?? code.toUpperCase();
}
