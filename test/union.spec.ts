"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';

describe("Unions", () => {
    it("Basic union", () => {

        interface IBase1 {
            a: number;
        }

        interface IBase2 {
            b: string;
        }

        expect(v.validate({ a: 1 }, convertToSchema<IBase1 | IBase2>())).toBe(true);
        expect(v.validate({ b: 'string' }, convertToSchema<IBase1 | IBase2>())).toBe(true);

        expect(v.validate({ a: 'string', b: 1 }, convertToSchema<IBase1 | IBase2>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 1 }, convertToSchema<IBase1 | IBase2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string' }, convertToSchema<IBase1 | IBase2>())).toBeInstanceOf(Array);
    });

    it("Root union", () => {

        expect(v.validate(123, convertToSchema<number | 'string'>())).toBe(true);
        expect(v.validate('string', convertToSchema<number | 'string'>())).toBe(true);

        expect(v.validate(true, convertToSchema<number | 'string'>())).toBeInstanceOf(Array);
        expect(v.validate(false, convertToSchema<number | 'string'>())).toBeInstanceOf(Array);
        expect(v.validate('string2', convertToSchema<number | 'string'>())).toBeInstanceOf(Array);
    });

    it("Union with optional", () => {

        interface IBase1 {
            a?: number;
        }

        interface IBase2 {
            b: string;
        }

        expect(v.validate({ }, convertToSchema<IBase1 | IBase2>())).toBe(true);
        expect(v.validate({ a: 1 }, convertToSchema<IBase1 | IBase2>())).toBe(true);
        expect(v.validate({ b: 'string' }, convertToSchema<IBase1 | IBase2>())).toBe(true);

        expect(v.validate({ a: 'string' }, convertToSchema<IBase1 | IBase2>())).toBeInstanceOf(Array);
    });

    it("Union with external with annotations", () => {

        interface IBase1 {
            a?: number;
        }

        expect(v.validate({ a: 1, str: '111', num: 1 }, convertToSchema<IBase1 | IExternal>())).toBe(true);
        expect(v.validate({ str: '111', num: 1 }, convertToSchema<IBase1 | IExternal>())).toBe(true);
        expect(v.validate({ a: 1 }, convertToSchema<IBase1 | IExternal>())).toBe(true);

        expect(v.validate({ a: 1, str: 'string', num: 1 }, convertToSchema<IBase1 & IExternal>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, str: '111', num: '1', b: 2 }, convertToSchema<IBase1 & IExternal>())).toBe(true);

    });
});
