/** Removes Synodal editorial `^^…^^` markers for on-screen display (voice compare strips separately). */
export const stripEditorialVerseMarkup = (text: string): string => text.replaceAll("^^", "");
