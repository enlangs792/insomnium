// 国际化系统
export type Locale = 'en' | 'zh-CN';

type TranslationMap = { [key: string]: string };
type Translations = { [locale in Locale]: TranslationMap };

let currentLocale: Locale = 'zh-CN';
let localeChangeListeners: Array<() => void> = [];

// 翻译字典
const translations: Translations = {
    'en': {},
    'zh-CN': {},
};

// 设置当前语言
export function setLocale(locale: Locale): void {
    if (currentLocale !== locale) {
        currentLocale = locale;
        // 通知所有监听器语言已更改
        localeChangeListeners.forEach(listener => listener());
    }
}

// 注册语言更改监听器
export function onLocaleChange(listener: () => void): () => void {
    localeChangeListeners.push(listener);
    // 返回取消监听的函数
    return () => {
        localeChangeListeners = localeChangeListeners.filter(l => l !== listener);
    };
}

// 获取当前语言
export function getLocale(): Locale {
    return currentLocale;
}

// 注册翻译
export function registerTranslations(locale: Locale, translationsMap: TranslationMap): void {
    translations[locale] = { ...translations[locale], ...translationsMap };
}

// 翻译函数 - 简化版本，暂时不支持参数替换
export function t(key: string, params?: { [key: string]: string | number }): string {
    const translationKey: string = translations[currentLocale][key] || translations['en'][key] || key;

    // 暂时不支持参数替换，直接返回翻译
    // TODO: 如果需要参数替换，可以在后续版本中实现
    return translationKey;
}

// 检查是否有翻译
export function hasTranslation(key: string): boolean {
    return key in translations[currentLocale] || key in translations['en'];
}
