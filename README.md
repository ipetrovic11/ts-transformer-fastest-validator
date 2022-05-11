[![Build Status][travis-image]][travis-url] [![Downloads](https://img.shields.io/npm/dm/ts-transformer-json-schema.svg)](https://www.npmjs.com/package/ts-transformer-json-schema)

# ts-transformer-json-schema [![NPM version][npm-image]][npm-url]
A TypeScript custom transformer to obtain json schema for [fastest-validator](https://github.com/icebob/fastest-validator) from TypeScript interface

```
$ npm install ts-transformer-json-schema --save
```

# Requirement
TypeScript >= 2.4.1
TTypeScript

## How to use directly with fastest-validator
```ts
import { schema } from 'ts-transformer-json-schema';
import Validator from 'fastest';

interface IExample {
  str: string;
}

const v = new Validator();
v.validate({ str: 'string' }, schema<IExample>());
```

## How to use with Moleculer
```ts
import { schema } from 'ts-transformer-json-schema';

interface IUser {
	name: string;
}

const GreeterService: ServiceSchema = {
  actions: {
    welcome: {
      params: schema<IUser>(),
      handler({ params: user }: Context<IUser>) {
        return `Welcome, ${user.name}`;
      }
    }
  }
}
```

There is moleculer template that comes with this transformer and configure compiler to use it:
https://github.com/ipetrovic11/moleculer-template-typescript

## How to use the custom transformer

Unfortunately, TypeScript itself does not currently provide any easy way to use custom transformers (See https://github.com/Microsoft/TypeScript/issues/14419).

### For ttypescript

See [ttypescript's README](https://github.com/cevek/ttypescript/blob/master/README.md) for how to use this with module bundlers such as webpack or Rollup.

```json
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "plugins": [
      { "transform": "ts-transformer-json-schema/transformer" }
    ]
  },
  // ...
}
```

### What can be transformed

Currently transformer can handle:
* Interfaces
* Neasted interfaces
* Extended interfaces

* Intersections and Unions

* Enums
* Emails - Predefined - IEmail
* Dates - Predefined - IDate
* UUID - Predefined - IUUID
* Forbidden - Predefined - IForbidden

* Additional properties

Take a look at [tests](https://github.com/ipetrovic11/ts-transformer-json-schema/blob/master/test/schema.spec.ts) for all possibilities.
All cases from fastest-validator should be covered, if not please report the issue.

# License

MIT

[travis-image]:https://travis-ci.org/ipetrovic11/ts-transformer-json-schema.svg?branch=master
[travis-url]:https://travis-ci.org/ipetrovic11/ts-transformer-json-schema
[npm-image]:https://img.shields.io/npm/v/ts-transformer-json-schema.svg?style=flat
[npm-url]:https://www.npmjs.com/package/ts-transformer-json-schema
