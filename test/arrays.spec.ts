"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';

describe("Arrays", () => {
    it("Array of strings as root", () => {

        interface IBase {
            type: 'Buffer';
            data: any[];
        }
        
        expect(v.validate([], convertToSchema<string[]>())).toBe(true);
        expect(v.validate(['1'], convertToSchema<string[]>())).toBe(true);
        expect(v.validate(['test', 'test2'], convertToSchema<string[]>())).toBe(true);

        expect(v.validate([1, 'test2'], convertToSchema<string[]>())).toBeInstanceOf(Array);
        expect(v.validate(['test', 2], convertToSchema<string[]>())).toBeInstanceOf(Array);
        expect(v.validate(['test', { type: 'string' }], convertToSchema<string[]>())).toBeInstanceOf(Array);
    });
    
    it("Array of any", () => {

        interface IBase {
            type: 'Buffer';
            data: any[];
        }
        
        expect(v.validate({ type: 'Buffer', data: [] }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ type: 'Buffer', data: [1,2,3] }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ type: 'Buffer', data: [1,'2',3] }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ type: 'Buffer', data: ['1','2','3'] }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ type: 'Buffer', data: [1,undefined,3] }, convertToSchema<IBase>())).toBe(true);

        expect(v.validate({ type: 'Buffer1', data: [1,undefined,3] }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ type: 'Buffer', data: 1 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ type: 'Buffer', data: 'string' }, convertToSchema<IBase>())).toBeInstanceOf(Array);
    });

    it("Array of objects", () => {

        interface IObject {
            a: number;
        }

        interface IBase {
            type: 'Buffer';
            data: IObject[];
        }
        
        expect(v.validate({ type: 'Buffer', data: [] }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ type: 'Buffer', data: [{ a: 1}] }, convertToSchema<IBase>())).toBe(true);
        expect(v.validate({ type: 'Buffer', data: [{ a: 1}, { a: 10}] }, convertToSchema<IBase>())).toBe(true);

        expect(v.validate({ type: 'Buffer1', data: [1,undefined,3] }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ type: 'Buffer', data: 1 }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ type: 'Buffer', data: 'string' }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ type: 'Buffer', data: [{ a: 'string'}] }, convertToSchema<IBase>())).toBeInstanceOf(Array);
        expect(v.validate({ type: 'Buffer', data: [{ a: 1}, { a: 'string'}] }, convertToSchema<IBase>())).toBeInstanceOf(Array);
    });
});
