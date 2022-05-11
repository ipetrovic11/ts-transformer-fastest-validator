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

        interface IStrict {
            /**
             * @convert true
             */
            property: number;
        }

        expect(convertToSchema<IStrict>()).toStrictEqual({
            property: {
                type: 'number',
                convert: true,
            }
        });
    });
});
