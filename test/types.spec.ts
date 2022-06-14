"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';
import { IUrl } from '../predefined';

describe("Types", () => {

    it("Basic type", () => {

        type TestType = { a: number; b: string };

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<TestType>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
    });

    it("Union type", () => {

        type TestType = { a: number; b: string } | { a: string; b: number };

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<TestType>())).toBe(true);
        expect(v.validate({ b: 1, a: 'string' }, convertToSchema<TestType>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, b: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
    });

    it("Type with template", () => {

        type TestType<T> = { a: T; b: string } | { a: string; b: number };

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<TestType<number>>())).toBe(true);
        expect(v.validate({ b: 1, a: 'string' }, convertToSchema<TestType<number>>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<TestType<number>>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType<number>>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<TestType<number>>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, b: 1 }, convertToSchema<TestType<number>>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<TestType<number>>())).toBeInstanceOf(Array);
    });

    it("Enumerable type", () => {

        enum Enumerable {
            a = 'a',
            b = 'b'
        }

        type TestType = { [type in Enumerable]: number; };

        expect(v.validate({ a: 1, b: 1 }, convertToSchema<TestType>())).toBe(true);

        expect(v.validate({ a: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
    });

    it("External in type", () => {

        type TestType = { a: IExternal; };

        expect(v.validate({ a: { str: '111', num: 1 } }, convertToSchema<TestType>())).toBe(true);

        expect(v.validate({ a: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { str: 'string', num: 1 } }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { str: '111', num: 'string' } }, convertToSchema<TestType>())).toBeInstanceOf(Array);
    });

    it("Predefined in type", () => {

        type TestType = { a: IUrl; };

        expect(v.validate({ a: 'https://www.google.com' }, convertToSchema<TestType>())).toBe(true);

        expect(v.validate({ a: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
    });

    it("Buffer in type", () => {

        type TestType = { a: Buffer; };

        expect(v.validate({ a: Buffer.from([1, 2, 3]) }, convertToSchema<TestType>())).toBe(true);

        expect(v.validate({ a: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 1 }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<TestType>())).toBeInstanceOf(Array);
    });


});
