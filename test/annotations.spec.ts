"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';
import { IEmail, IDate, IUrl, IUUID } from '../predefined';

describe("Local annotations", () => {
    it("Root object annotation", () => {

        /**
         * @$$strict true
         */
        interface IStrict {
            property: string;
        }

        expect(convertToSchema<IStrict>()).toStrictEqual({
            $$strict: true,
            property: {
                type: 'string'
            }
        });

        /**
         * @$$strict remove
         */
         interface IStrict2 {
            property: string;
        }

        expect(convertToSchema<IStrict2>()).toStrictEqual({
            $$strict: 'remove',
            property: {
                type: 'string'
            }
        });
    });

    it("Property annotation", () => {

        interface IAnnotated {
            /**
             * @convert true
             */
            property: number;
        }
        expect(convertToSchema<IAnnotated>()).toStrictEqual({
            property: {
                type: 'number',
                convert: true,
            }
        });

        interface IAnnotated2 {
            /**
             * @convert true
             */
            property: IDate;
        }
        expect(convertToSchema<IAnnotated2>()).toStrictEqual({
            property: {
                type: 'date',
                convert: true,
            }
        });
    });

    it("Intersection annotation", () => {

        interface IAnnotated1 {
            /**
             * @convert true
             */
            property1: number;
        }

        interface IAnnotated2 {
            /**
             * @min 6
             */
            property2: string;
        }

        expect(convertToSchema<IAnnotated1 & IAnnotated2>()).toStrictEqual({
            property1: { type: "number", convert: true },
            property2: { type: "string", min: 6 },
        });
    });

    it("External annotation", () => {
        expect(convertToSchema<IExternal>()).toStrictEqual({
            str: { type: "string", empty: false, numeric: true },
            num: { type: "number", positive: true, convert: true },
            $$strict: true
        });
    });
});
