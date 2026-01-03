import { Request, Response, NextFunction } from 'express';
import xss, { IFilterXSSOptions } from 'xss';

const sanitizerOptions: IFilterXSSOptions = {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
};

const sanitizer = new xss.FilterXSS(sanitizerOptions);

type SanitizableValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | Date
    | Record<string, unknown>
    | SanitizableValue[];

function sanitizeValue(value: unknown): SanitizableValue {
    if (typeof value === 'string') {
        return sanitizer.process(value.trim());
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (value instanceof Date) {
        return value;
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const sanitizedEntries = Object.entries(record).map(([key, val]) => [key, sanitizeValue(val)]);
        return Object.fromEntries(sanitizedEntries);
    }

    return value as SanitizableValue;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    next();
}

export function sanitizeQuery(req: Request, _res: Response, next: NextFunction): void {
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeValue(req.query) as Request['query'];
    }
    next();
}

export function sanitizeParams(req: Request, _res: Response, next: NextFunction): void {
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params) as Request['params'];
    }
    next();
}
