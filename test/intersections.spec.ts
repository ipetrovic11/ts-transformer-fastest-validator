"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';
import { IEmail, IDate, IUrl, IUUID } from '../predefined';

describe("Intersection primitive and object", () => {
    it("String validation", () => {

        interface IBase1 {
            part1: string;
        }

        interface IIntersection {
            combined: IBase1 & string;
        }

        // expect(convertToSchema<IIntersection>()).toStrictEqual({
        //     combined: {
        //         type: 'object', props: {
        //             part1: { type: "string" }
        //         }
        //     }
        // });
    });
});
