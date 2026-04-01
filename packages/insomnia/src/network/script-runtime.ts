import clone from 'clone';

import { getSetCookieHeaders } from '../common/misc';
import type { RenderedRequest } from '../common/render';
import type { Cookie, CookieJar } from '../models/cookie-jar';
import type { Environment } from '../models/environment';
import type { Request } from '../models/request';
import type { ScriptConfig } from '../models/script';
import type { ResponsePatch } from '../main/network/libcurl-promise';
import * as pluginContexts from '../plugins/context/index';

type ScriptStage =
  | 'environment.pre-request'
  | 'request.pre-request'
  | 'request.post-response'
  | 'environment.post-response';

type ScriptConsole = Pick<Console, 'debug' | 'error' | 'info' | 'log' | 'warn'>;

const AsyncFunction = Object.getPrototypeOf(async function () { /** noop */ }).constructor as new (
  ...args: string[]
) => (...params: any[]) => Promise<void>;

const createScriptConsole = (stage: ScriptStage, scriptName: string): ScriptConsole => {
  const prefix = `[script:${stage}] ${scriptName}`;

  return {
    debug: (...args: any[]) => console.debug(prefix, ...args),
    error: (...args: any[]) => console.error(prefix, ...args),
    info: (...args: any[]) => console.info(prefix, ...args),
    log: (...args: any[]) => console.log(prefix, ...args),
    warn: (...args: any[]) => console.warn(prefix, ...args),
  };
};

const cloneCookie = (cookie: Cookie): Cookie => clone(cookie);

const createCookieApi = (cookieJar: CookieJar) => ({
  all() {
    return cookieJar.cookies.map(cloneCookie);
  },
  clear() {
    cookieJar.cookies = [];
  },
  get(name: string) {
    return cookieJar.cookies.find(cookie => cookie.key === name) || null;
  },
  remove(name: string) {
    cookieJar.cookies = cookieJar.cookies.filter(cookie => cookie.key !== name);
  },
  set(name: string, value: string, options: Partial<Cookie> = {}) {
    const existingCookie = cookieJar.cookies.find(cookie => cookie.key === name);
    const nextCookie: Cookie = {
      id: existingCookie?.id || Math.random().toString().replace('0.', ''),
      key: name,
      value,
      expires: options.expires ?? existingCookie?.expires ?? null,
      domain: options.domain ?? existingCookie?.domain ?? '',
      path: options.path ?? existingCookie?.path ?? '/',
      secure: options.secure ?? existingCookie?.secure ?? false,
      httpOnly: options.httpOnly ?? existingCookie?.httpOnly ?? false,
      extensions: options.extensions ?? existingCookie?.extensions ?? [],
      creation: options.creation ?? existingCookie?.creation ?? new Date(),
      creationIndex: options.creationIndex ?? existingCookie?.creationIndex,
      hostOnly: options.hostOnly ?? existingCookie?.hostOnly,
      pathIsDefault: options.pathIsDefault ?? existingCookie?.pathIsDefault,
      lastAccessed: new Date(),
    };

    if (existingCookie) {
      Object.assign(existingCookie, nextCookie);
      return existingCookie;
    }

    cookieJar.cookies.push(nextCookie);
    return nextCookie;
  },
});

const createEnvironmentApi = (environment: Environment) => ({
  all() {
    return clone(environment.data || {});
  },
  get(name: string) {
    return environment.data?.[name];
  },
  has(name: string) {
    return Object.prototype.hasOwnProperty.call(environment.data || {}, name);
  },
  remove(name: string) {
    if (!environment.data) {
      environment.data = {};
    }

    delete environment.data[name];
  },
  set(name: string, value: any) {
    if (!environment.data) {
      environment.data = {};
    }

    environment.data[name] = value;
  },
  merge(values: Record<string, any>) {
    environment.data = {
      ...(environment.data || {}),
      ...values,
    };
  },
});

const createResponseApi = (response: ResponsePatch) => {
  const responseApi = pluginContexts.response.init(response).response as Record<string, any>;

  return {
    ...responseApi,
    getBodyText() {
      return String(responseApi.getBody());
    },
    getBodyJson() {
      return JSON.parse(String(responseApi.getBody()));
    },
    getSetCookieHeaders() {
      return getSetCookieHeaders(response.headers || []).map(header => header.value);
    },
  };
};

async function runScript({
  stage,
  scriptName,
  script,
  request,
  context,
  environment,
  cookieJar,
  response,
}: {
  stage: ScriptStage;
  scriptName: string;
  script: ScriptConfig;
  request: RenderedRequest;
  context: Record<string, any>;
  environment: Environment;
  cookieJar: CookieJar;
  response?: ResponsePatch;
}) {
  if (!script.enabled || !script.content.trim()) {
    return;
  }

  if (script.language !== 'javascript') {
    throw new Error(
      `${scriptName} uses unsupported language "${script.language}". Only JavaScript scripts can run right now.`,
    );
  }

  const execute = new AsyncFunction(
    'request',
    'response',
    'environment',
    'cookies',
    'console',
    `'use strict';\n${script.content}`,
  );

  try {
    await execute(
      pluginContexts.request.init(request, context, Boolean(response)).request,
      response ? createResponseApi(response) : undefined,
      createEnvironmentApi(environment),
      createCookieApi(cookieJar),
      createScriptConsole(stage, scriptName),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${scriptName} failed: ${message}`);
  }
}

export async function runPreRequestScripts({
  request,
  context,
  requestModel,
  baseEnvironment,
  activeEnvironment,
}: {
  request: RenderedRequest;
  context: Record<string, any>;
  requestModel: Request;
  baseEnvironment: Environment;
  activeEnvironment: Environment;
}) {
  const environments = [baseEnvironment];
  if (activeEnvironment._id !== baseEnvironment._id) {
    environments.push(activeEnvironment);
  }

  for (const environment of environments) {
    await runScript({
      stage: 'environment.pre-request',
      scriptName: environment.name || 'Environment',
      script: environment.preRequestScriptConfig,
      request,
      context,
      environment,
      cookieJar: request.cookieJar,
    });
  }

  await runScript({
    stage: 'request.pre-request',
    scriptName: requestModel.name || requestModel._id,
    script: requestModel.preRequestScriptConfig,
    request,
    context,
    environment: activeEnvironment,
    cookieJar: request.cookieJar,
  });
}

export async function runPostResponseScripts({
  request,
  context,
  response,
  requestModel,
  baseEnvironment,
  activeEnvironment,
}: {
  request: RenderedRequest;
  context: Record<string, any>;
  response: ResponsePatch;
  requestModel: Request;
  baseEnvironment: Environment;
  activeEnvironment: Environment;
}) {
  await runScript({
    stage: 'request.post-response',
    scriptName: requestModel.name || requestModel._id,
    script: requestModel.postResponseScriptConfig,
    request,
    context,
    environment: activeEnvironment,
    cookieJar: request.cookieJar,
    response,
  });

  const environments = [baseEnvironment];
  if (activeEnvironment._id !== baseEnvironment._id) {
    environments.push(activeEnvironment);
  }

  for (const environment of environments) {
    await runScript({
      stage: 'environment.post-response',
      scriptName: environment.name || 'Environment',
      script: environment.postResponseScriptConfig,
      request,
      context,
      environment,
      cookieJar: request.cookieJar,
      response,
    });
  }
}
