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

    it("Intersection with optional any", () => {

        interface IBase1 {
            a?: any;
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

    it("Intersection of interfaces with the same property but different type", () => {
        enum Enum1 {
          One = "One",
        }
        enum Enum2 {
          Two = "Two",
          Three = "Three",
        }
    
        interface test1 {
          a: Enum1;
        }
    
        interface test2 {
          a: Enum1 | Enum2;
        }
    
        expect(v.validate({ a: 'One' }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: Enum1.One }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: Enum2.Two }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: Enum2.Three }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'Two' }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
    });

    it("Intersection of interfaces with the same property but unsuported types", () => {    
        interface test1 {
          a: number;
        }
    
        interface test2 {
          a: string;
        }
    
        expect(v.validate({ }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: null }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: undefined }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: 1 }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'Two' }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
    });

    it("Intersection of interfaces with the same property but different type optionals", () => {
        enum Enum1 {
          One = "One",
        }
        enum Enum2 {
          Two = "Two",
          Three = "Three",
        }
    
        interface test1 {
          a?: Enum1;
        }
    
        interface test2 {
          a?: Enum1 | Enum2;
        }
    
        expect(v.validate({ }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: 'One' }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: Enum1.One }, convertToSchema<test1 & test2>())).toBe(true);
        expect(v.validate({ a: Enum2.Two }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: Enum2.Three }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'Three' }, convertToSchema<test1 & test2>())).toBeInstanceOf(Array);
    });
});
