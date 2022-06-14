"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';
import { IUrl } from '../predefined';

describe("Interfaces", () => {
    it("Basic interface", () => {

        interface IBase {
            a: number;
            b: string;
        }

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<IBase>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
    });

    it("External interface", () => {

        expect(v.validate({ str: '123', num: 1 }, convertToSchema<IExternal>())).toBe(true);
        expect(v.validate({ str: '123', num: '1' }, convertToSchema<IExternal>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IExternal>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<IExternal>())).toBeInstanceOf(Array);
        expect(v.validate({ str: 1, num: 'string' }, convertToSchema<IExternal>())).toBeInstanceOf(Array);
    });

    it("Interface with optional", () => {

        interface IBase {
            a?: number;
            b: string;
        }

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ b: 'string' }, convertToSchema<IBase>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
    });

    it("Interface with optional any", () => {

        interface ITest {
            a: string;
            b: any;
            c?: any;
        }

        expect(v.validate({ a: 'string', b: 1 }, convertToSchema<ITest>())).toBe(true);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<ITest>())).toBe(true);
        expect(v.validate({ a: 'string', b: false }, convertToSchema<ITest>())).toBe(true);
        expect(v.validate({ a: 'string', b: false, c: 1 }, convertToSchema<ITest>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ a: [{ a: 1, b: 2 }] }, convertToSchema<ITest>())).toBeInstanceOf(Array);
    });

    it("Interface with predefined", () => {

        interface IBase {
            a: IUrl;
        }

        expect(v.validate({ a: 'https://www.workpuls.com' }, convertToSchema<IBase>())).toBe(true);

        expect(v.validate({ a: 'string' }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
    });

    it("Neasted interfaces", () => {

        interface IBase1 {
            a: IBase2;
        }

        interface IBase2 {
            b: string;
        }

        expect(v.validate({ a: { b: 'string' } }, convertToSchema<IBase1>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { } }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { b: 1} }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
    });

    it("Infinite loop interfaces", () => {

        interface IBase1 {
            a: IBase2;
        }

        interface IBase2 {
            b: IBase3;
        }

        interface IBase3 {
            c: IBase1;
        }

        expect(v.validate({ a: { b: { c: {} } } }, convertToSchema<IBase1>())).toBe(true);
        expect(v.validate({ a: { b: { c: { a: 1} } } }, convertToSchema<IBase1>())).toBe(true);
        expect(v.validate({ a: { b: { c: { b: 'string' } } } }, convertToSchema<IBase1>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { } }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { b: 1} }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
        expect(v.validate({ a: { b: {} } }, convertToSchema<IBase1>())).toBeInstanceOf(Array);
    });

    it("Interface with union primitives", () => {

        interface ITest {
            a: number | string;
        }

        expect(v.validate({a: 100}, convertToSchema<ITest>())).toBe(true);
        expect(v.validate({a: 'string'}, convertToSchema<ITest>())).toBe(true);

        expect(v.validate(1, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate('string', convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({}, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({a: true}, convertToSchema<ITest>())).toBeInstanceOf(Array);
    });

    it("Index interface", () => {
        interface IIndex {
            [key: string]: string;
        }

        expect(v.validate({a: 'string'}, convertToSchema<IIndex>())).toBe(true);
        expect(v.validate({b: 'string', c: 'string'}, convertToSchema<IIndex>())).toBe(true);
        expect(v.validate({d: 'string', e: 'string', f: 'string'}, convertToSchema<IIndex>())).toBe(true);
    });

    it("Template interface", () => {
        interface ITemplate<T> {
            a: number;
            b: T;
        }

        expect(v.validate({a: 1, b: 2}, convertToSchema<ITemplate<number>>())).toBe(true);

        expect(v.validate({ a: 'string', b: 2 }, convertToSchema<ITemplate<number>>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 2, b: 'string' }, convertToSchema<ITemplate<number>>())).toBeInstanceOf(Array);
    });

    it("Extended interface", () => {
        interface IInterface1 {
            a: number;
        }

        interface ITest extends IInterface1 {
            b: string;
        }

        expect(v.validate({a: 1, b: 'string'}, convertToSchema<ITest>())).toBe(true);

        expect(v.validate({ a: 1 }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, b: 2 }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<ITest>())).toBeInstanceOf(Array);
    });

    it("Overriden interface", () => {
        interface IInterface1 {
            a: number;
            b: number;
        }

        interface ITest extends IInterface1 {
            b: any;
        }

        expect(v.validate({a: 1, b: 1 }, convertToSchema<ITest>())).toBe(true);
        expect(v.validate({a: 1, b: 'string'}, convertToSchema<ITest>())).toBe(true);
        expect(v.validate({a: 1, b: true }, convertToSchema<ITest>())).toBe(true);

        expect(v.validate({ a: 1 }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<ITest>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<ITest>())).toBeInstanceOf(Array);
    });

    it("Array of basic interface", () => {

        interface IBase {
            a: number;
            b: string;
        }

        interface IArray {
            a: IBase[]
        }

        expect(v.validate({ a: [{ a: 1, b: 'string' }] }, convertToSchema<IArray>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IArray>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<IArray>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IArray>())).toBeInstanceOf(Array);
        expect(v.validate({ a: [{ a: 1, b: 2 }] }, convertToSchema<IArray>())).toBeInstanceOf(Array);
    });

    it("Omit property of interface", () => {

        interface IBase {
            a: number;
            b: string;
        }

        interface IOmit extends Omit<IBase, 'a' | 'c'> {
        }

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<IOmit>())).toBe(true);
        expect(v.validate({ b: 'string' }, convertToSchema<IOmit>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
        expect(v.validate({ a: [{ a: 1, b: 2 }] }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
    });

    it("Omit property of interface with optional", () => {

        interface IBase {
            a: number;
            b?: string;
            c: number;
            d: string;
        }

        interface IOmit extends Omit<IBase, 'a' | 'c'> {
        }

        expect(v.validate({ a: 1, b: 'string', c: 1, d: 'string' }, convertToSchema<IOmit>())).toBe(true);
        expect(v.validate({ a: 1, b: 'string', d: 'string' }, convertToSchema<IOmit>())).toBe(true);
        expect(v.validate({ a: 1, c: 1, d: 'string' }, convertToSchema<IOmit>())).toBe(true);
        expect(v.validate({ b: 'string', d: 'string' }, convertToSchema<IOmit>())).toBe(true);
        expect(v.validate({ d: 'string' }, convertToSchema<IOmit>())).toBe(true);

        interface IOmitExtended extends Omit<IBase, 'a' | 'c'> {
            e: string;
        }

        expect(v.validate({ a: 1, b: 'string', c: 1, d: 'string', e: 'string' }, convertToSchema<IOmitExtended>())).toBe(true);
        expect(v.validate({ a: 1, b: 'string', d: 'string', e: 'string' }, convertToSchema<IOmitExtended>())).toBe(true);
        expect(v.validate({ a: 1, c: 1, d: 'string', e: 'string' }, convertToSchema<IOmitExtended>())).toBe(true);
        expect(v.validate({ b: 'string', d: 'string', e: 'string' }, convertToSchema<IOmitExtended>())).toBe(true);
        expect(v.validate({ d: 'string', e: 'string' }, convertToSchema<IOmitExtended>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 1 }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
        expect(v.validate({ b: [{ a: 1, b: 2 }] }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
        expect(v.validate({ }, convertToSchema<IOmit>())).toBeInstanceOf(Array);
    });
});
