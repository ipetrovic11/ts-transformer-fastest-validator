"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';

describe("Intersections", () => {
    it("Basic intersection", () => {

        interface IBase1 {
            a: number;
        }

        interface IBase2 {
            b: string;
        }

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<IBase1 & IBase2>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IBase1 & IBase2>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<IBase1 & IBase2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase1 & IBase2>())).toBeInstanceOf(Array);
    });

    it("Intersection with optional", () => {

        interface IBase1 {
            a?: number;
        }

        interface IBase2 {
            b: string;
        }

        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<IBase1 & IBase2>())).toBe(true);
        expect(v.validate({ b: 'string' }, convertToSchema<IBase1 & IBase2>())).toBe(true);

        expect(v.validate({ a: 1, b: 2 }, convertToSchema<IBase1 & IBase2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IBase1 & IBase2>())).toBeInstanceOf(Array);
    });

    it("Intersection of external with annotations and optional", () => {

        interface IBase1 {
            a?: number;
        }

        expect(v.validate({ a: 1, str: '111', num: 1 }, convertToSchema<IBase1 & IExternal>())).toBe(true);
        expect(v.validate({ str: '111', num: 1 }, convertToSchema<IBase1 & IExternal>())).toBe(true);
        expect(v.validate({ a: 1, str: '111', num: '1' }, convertToSchema<IBase1 & IExternal>())).toBe(true);

        expect(v.validate({ a: 1, str: 'string', num: 1 }, convertToSchema<IBase1 & IExternal>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, str: '111', num: '1', b: 2 }, convertToSchema<IBase1 & IExternal>())).toBe(true);

    });
});
