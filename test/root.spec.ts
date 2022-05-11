"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IEmail, IDate, IUrl, IUUID } from '../predefined';

describe("Root elements", () => {

    it("Literal string root", () => {
        expect(v.validate('string', convertToSchema<'string'>())).toBe(true);

        expect(v.validate(1, convertToSchema<'string'>())).toBeInstanceOf(Array);
    });

    it("Literal number root", () => {
        expect(v.validate(1, convertToSchema<1>())).toBe(true);

        expect(v.validate('string', convertToSchema<1>())).toBeInstanceOf(Array);
    });

    it("Literal boolean root", () => {
        expect(v.validate(true, convertToSchema<true>())).toBe(true);

        expect(v.validate('string', convertToSchema<true>())).toBeInstanceOf(Array);
    });

    it("String root", () => {
        expect(v.validate('string', convertToSchema<string>())).toBe(true);

        expect(v.validate(1, convertToSchema<string>())).toBeInstanceOf(Array);
    });

    it("Number root", () => {
        expect(v.validate(1, convertToSchema<number>())).toBe(true);

        expect(v.validate('string', convertToSchema<number>())).toBeInstanceOf(Array);
    });

    it("Boolean root", () => {
        expect(v.validate(true, convertToSchema<boolean>())).toBe(true);

        expect(v.validate('string', convertToSchema<boolean>())).toBeInstanceOf(Array);
    });

    it("String or number union root", () => {
        expect(v.validate('string', convertToSchema<string | number>())).toBe(true);
        expect(v.validate(1, convertToSchema<string | number>())).toBe(true);

        expect(v.validate(true, convertToSchema<string | number>())).toBeInstanceOf(Array);
    });

    it("Number or boolean union root", () => {
        expect(v.validate(true, convertToSchema<boolean | number>())).toBe(true);
        expect(v.validate(1, convertToSchema<boolean | number>())).toBe(true);

        expect(v.validate('string', convertToSchema<boolean | number>())).toBeInstanceOf(Array);
    });

    it("Email root", () => {
        expect(v.validate('test@domain.com', convertToSchema<IEmail>())).toBe(true);
        expect(v.validate('test+1@domain.com', convertToSchema<IEmail>())).toBe(true);

        expect(v.validate('string', convertToSchema<IEmail>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IEmail>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IEmail>())).toBeInstanceOf(Array);
        expect(v.validate('test@com', convertToSchema<IEmail>())).toBeInstanceOf(Array);
    });

    it("Date root", () => {
        expect(v.validate(new Date(), convertToSchema<IDate>())).toBe(true);

        expect(v.validate('string', convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate('17/02/2009/22', convertToSchema<IDate>())).toBeInstanceOf(Array);
        expect(v.validate('2022-49-11T05:54:00.035Z', convertToSchema<IDate>())).toBeInstanceOf(Array);
    });

    it("UUID root", () => {
        expect(v.validate('1a3a8f2c-d0ef-11ec-9d64-0242ac120002', convertToSchema<IUUID>())).toBe(true); // UUID V1
        expect(v.validate('a75811f3-c86f-414a-b4d2-26d21c32b4c7', convertToSchema<IUUID>())).toBe(true); // UUID V4

        expect(v.validate('string', convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate('a75811f3c86f414ab4d226d21c32b4c7', convertToSchema<IUUID>())).toBeInstanceOf(Array);
        expect(v.validate('a75811f3-c86f-414a-b4d2-26d21c32b4c', convertToSchema<IUUID>())).toBeInstanceOf(Array);
    });

    it("URL root", () => {
        expect(v.validate('http://google.com', convertToSchema<IUrl>())).toBe(true);
        expect(v.validate('https://github.com/icebob', convertToSchema<IUrl>())).toBe(true);

        expect(v.validate('string', convertToSchema<IUrl>())).toBeInstanceOf(Array);
        expect(v.validate(true, convertToSchema<IUrl>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<IUrl>())).toBeInstanceOf(Array);
        expect(v.validate('www.facebook.com', convertToSchema<IUrl>())).toBeInstanceOf(Array);
    });
});
