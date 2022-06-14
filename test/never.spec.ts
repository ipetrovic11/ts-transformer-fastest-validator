"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';

describe("Never", () => {

    it("Root Never", () => {

        expect(v.validate(undefined, convertToSchema<never>())).toBe(true);
        expect(v.validate(null, convertToSchema<never>())).toBe(true);

        expect(v.validate(1, convertToSchema<never>())).toBeInstanceOf(Array);
        expect(v.validate('string', convertToSchema<never>())).toBeInstanceOf(Array);
        expect(v.validate({}, convertToSchema<never>())).toBeInstanceOf(Array);
    });

    it("Interface with Never", () => {

        interface INever {
            a: string;
            b: never;
        }

        expect(v.validate({ a: 'string' }, convertToSchema<INever>())).toBe(true);
        expect(v.validate({ a: 'string', c: 1 }, convertToSchema<INever>())).toBe(true);
        expect(v.validate({ a: 'string', g: 'string' }, convertToSchema<INever>())).toBe(true);

        expect(v.validate({}, convertToSchema<INever>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<INever>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 1 }, convertToSchema<INever>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<INever>())).toBeInstanceOf(Array);
    });

    it("Interface with Undefined", () => {

        interface INever {
            a: string;
            b: undefined;
        }

        expect(v.validate({ a: 'string' }, convertToSchema<INever>())).toBe(true);
        expect(v.validate({ a: 'string', c: 1 }, convertToSchema<INever>())).toBe(true);
        expect(v.validate({ a: 'string', g: 'string' }, convertToSchema<INever>())).toBe(true);

        expect(v.validate({}, convertToSchema<INever>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<INever>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 1 }, convertToSchema<INever>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<INever>())).toBeInstanceOf(Array);
    });

    it("Interface with Null", () => {

        interface INull {
            a: string;
            b: null;
        }

        expect(v.validate({ a: 'string' }, convertToSchema<INull>())).toBe(true);
        expect(v.validate({ a: 'string', c: 1 }, convertToSchema<INull>())).toBe(true);
        expect(v.validate({ a: 'string', g: 'string' }, convertToSchema<INull>())).toBe(true);

        expect(v.validate({}, convertToSchema<INull>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<INull>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 1 }, convertToSchema<INull>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<INull>())).toBeInstanceOf(Array);
    });


    it("Interface with Nullable", () => {

        interface INullable {
            a: string;
            b: string | null;
        }

        expect(v.validate({ a: 'string', b: 'string' }, convertToSchema<INullable>())).toBe(true);
        expect(v.validate({ a: 'string', b: null }, convertToSchema<INullable>())).toBe(true);

        expect(v.validate({ a: 'string', b: 1 }, convertToSchema<INullable>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, b: 'string' }, convertToSchema<INullable>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1, b: 1 }, convertToSchema<INullable>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string' }, convertToSchema<INullable>())).toBeInstanceOf(Array);
    });

});
