"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';
import { IEmail, IDate, IUrl, IUUID } from '../predefined';

describe("Root elements literals", () => {
    it("String validation", () => {
        expect(v.validate('string', convertToSchema<'string'>())).toBe(true);

        expect(v.validate(1, convertToSchema<'string'>())).toBeInstanceOf(Array);
    });

    it("Number validation", () => {
        expect(v.validate(1, convertToSchema<1>())).toBe(true);

        expect(v.validate('string', convertToSchema<1>())).toBeInstanceOf(Array);
    });

    it("Boolean validation", () => {
        expect(v.validate(true, convertToSchema<true>())).toBe(true);

        expect(v.validate('string', convertToSchema<true>())).toBeInstanceOf(Array);
    });
});

describe("Root elements primitives", () => {
    it("String validation", () => {
        expect(v.validate('string', convertToSchema<string>())).toBe(true);

        expect(v.validate(1, convertToSchema<string>())).toBeInstanceOf(Array);
    });

    it("Number validation", () => {
        expect(v.validate(1, convertToSchema<number>())).toBe(true);

        expect(v.validate('string', convertToSchema<number>())).toBeInstanceOf(Array);
    });

    it("Boolean validation", () => {
        expect(v.validate(true, convertToSchema<boolean>())).toBe(true);

        expect(v.validate('string', convertToSchema<boolean>())).toBeInstanceOf(Array);
    });
});

describe("Root elements union", () => {
    it("String or number validation", () => {
        expect(v.validate('string', convertToSchema<string | number>())).toBe(true);
        expect(v.validate(1, convertToSchema<string | number>())).toBe(true);

        expect(v.validate(true, convertToSchema<string | number>())).toBeInstanceOf(Array);
    });

    it("Number or boolean validation", () => {
        expect(v.validate(true, convertToSchema<boolean | number>())).toBe(true);
        expect(v.validate(1, convertToSchema<boolean | number>())).toBe(true);

        expect(v.validate('string', convertToSchema<boolean | number>())).toBeInstanceOf(Array);
    });
});

describe("Root elements predefined", () => {
    it("Email validation", () => {
        expect(v.validate('test@domain.com', convertToSchema<IEmail>())).toBe(true);
        expect(v.validate('test+1@domain.com', convertToSchema<IEmail>())).toBe(true);

        expect(v.validate('string', convertToSchema<IEmail>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IEmail>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IEmail>())).toBeInstanceOf(Array);
        expect(v.validate('test@com', convertToSchema<IEmail>())).toBeInstanceOf(Array);
    });

    it("Date validation", () => {
        expect(v.validate(new Date(), convertToSchema<IDate>())).toBe(true);

        expect(v.validate('string', convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate('17/02/2009/22', convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate('2022-49-11T05:54:00.035Z', convertToSchema<IDate>())).toBeInstanceOf(Array);
    });

    it("UUID validation", () => {
        expect(v.validate('1a3a8f2c-d0ef-11ec-9d64-0242ac120002', convertToSchema<IUUID>())).toBe(true); // UUID V1
        expect(v.validate('a75811f3-c86f-414a-b4d2-26d21c32b4c7', convertToSchema<IUUID>())).toBe(true); // UUID V4

        expect(v.validate('string', convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate('a75811f3c86f414ab4d226d21c32b4c7', convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate('a75811f3-c86f-414a-b4d2-26d21c32b4c', convertToSchema<IUUID>())).toBeInstanceOf(Array);
    });

    it("URL validation", () => {
        expect(v.validate('http://google.com', convertToSchema<IUrl>())).toBe(true);
        expect(v.validate('https://github.com/icebob', convertToSchema<IUrl>())).toBe(true);

        expect(v.validate('string', convertToSchema<IUrl>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IUrl>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IUrl>())).toBeInstanceOf(Array);
        expect(v.validate('www.facebook.com', convertToSchema<IUrl>())).toBeInstanceOf(Array);
    });
});