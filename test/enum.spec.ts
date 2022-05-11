"use strict";

const Validator = require('fastest-validator');
const v = new Validator();

import { convertToSchema } from '../index';
import { IExternal } from './interfaces';
import { IUrl } from '../predefined';

describe("Enumerables", () => {

    it("Root enum", () => {

        enum UserGroup {
            Admin = 'admin',
            Manager = 'manager',
            Employee = 'employee'
        }

        expect(v.validate('admin', convertToSchema<UserGroup>())).toBe(true);
        expect(v.validate('manager', convertToSchema<UserGroup>())).toBe(true);
        expect(v.validate('employee', convertToSchema<UserGroup>())).toBe(true);

        expect(v.validate('employee1', convertToSchema<UserGroup>())).toBeInstanceOf(Array);
        expect(v.validate('string', convertToSchema<UserGroup>())).toBeInstanceOf(Array);
        expect(v.validate(1, convertToSchema<UserGroup>())).toBeInstanceOf(Array);

    });

    it("Enum interface", () => {

        enum UserGroup {
            Admin = 'admin',
            Manager = 'manager',
            Employee = 'employee'
        }

        interface IEnumerable {
            a: UserGroup;
        }

        expect(v.validate({ a: 'admin' }, convertToSchema<IEnumerable>())).toBe(true);
        expect(v.validate({ a: 'manager' }, convertToSchema<IEnumerable>())).toBe(true);
        expect(v.validate({ a: 'employee' }, convertToSchema<IEnumerable>())).toBe(true);

        expect(v.validate({ a: 'admin1' }, convertToSchema<IEnumerable>())).toBeInstanceOf(Array);
        expect(v.validate({ b: 'string' }, convertToSchema<IEnumerable>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IEnumerable>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 1 }, convertToSchema<IEnumerable>())).toBeInstanceOf(Array);
        expect(v.validate({ a: 'string' }, convertToSchema<IEnumerable>())).toBeInstanceOf(Array);
    });

});
