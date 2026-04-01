export type ScriptLanguage = 'javascript' | 'typescript' | 'python';

export interface ScriptConfig {
  language: ScriptLanguage;
  content: string;
  description: string;
  enabled: boolean;
}

export const createDefaultScriptConfig = (): ScriptConfig => ({
  language: 'javascript',
  content: '',
  description: '',
  enabled: true,
});

export const normalizeScriptLanguage = (language: unknown): ScriptLanguage => {
  if (language === 'typescript' || language === 'python' || language === 'javascript') {
    return language;
  }

  return 'javascript';
};

export const normalizeScriptConfig = (value: unknown): ScriptConfig => {
  if (typeof value === 'string') {
    return {
      ...createDefaultScriptConfig(),
      content: value,
    };
  }

  if (value && typeof value === 'object') {
    const script = value as Partial<ScriptConfig>;
    return {
      language: normalizeScriptLanguage(script.language),
      content: typeof script.content === 'string' ? script.content : '',
      description: typeof script.description === 'string' ? script.description : '',
      enabled: typeof script.enabled === 'boolean' ? script.enabled : true,
    };
  }

  return createDefaultScriptConfig();
};
