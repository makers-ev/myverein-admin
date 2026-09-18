/** Same 11-language set as the website/mobile `LanguageContext` registries (ADR-009). de/en are the only ones the backend requires on a template override. */
export const SUPPORTED_LANGUAGES = [
  { id: 'de', label: 'German', nativeLabel: 'Deutsch', isRTL: false },
  { id: 'en', label: 'English', nativeLabel: 'English', isRTL: false },
  { id: 'fr', label: 'French', nativeLabel: 'Français', isRTL: false },
  { id: 'es', label: 'Spanish', nativeLabel: 'Español', isRTL: false },
  { id: 'pt', label: 'Portuguese', nativeLabel: 'Português', isRTL: false },
  { id: 'it', label: 'Italian', nativeLabel: 'Italiano', isRTL: false },
  { id: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', isRTL: false },
  { id: 'pl', label: 'Polish', nativeLabel: 'Polski', isRTL: false },
  { id: 'ru', label: 'Russian', nativeLabel: 'Русский', isRTL: false },
  { id: 'ja', label: 'Japanese', nativeLabel: '日本語', isRTL: false },
  { id: 'zh-Hans', label: 'Chinese (Simplified)', nativeLabel: '简体中文', isRTL: false },
] as const;

export type LanguageId = (typeof SUPPORTED_LANGUAGES)[number]['id'];
