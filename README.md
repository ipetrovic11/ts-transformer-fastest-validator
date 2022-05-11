[![Build Status][travis-image]][travis-url] [![Downloads](https://img.shields.io/npm/dm/ts-transformer-fastest-validator.svg)](https://www.npmjs.com/package/ts-transformer-fastest-validator)

# ts-transformer-fastest-validator [![NPM version][npm-image]][npm-url]
A TypeScript custom transformer to obtain json schema for [fastest-validator](https://github.com/icebob/fastest-validator) from TypeScript interface

```
$ npm install ts-transformer-fastest-validator --save
```

## How to use directly with fastest-validator
```ts
import { convertToSchema } from 'ts-transformer-fastest-validator';
import Validator from 'fastest';

interface IExample {
  str: string;
}

const v = new Validator();
v.validate({ str: 'string' }, convertToSchema<IExample>());
```

## How to use with Moleculer
```ts
import { convertToSchema } from 'ts-transformer-fastest-validator';

interface IUser {
	name: string;
}

const GreeterService: ServiceSchema = {
  actions: {
    welcome: {
      params: convertToSchema<IUser>(),
      handler({ params: user }: Context<IUser>) {
        return `Welcome, ${user.name}`;
      }
    }
  }
}
```

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
      { "transform": "ts-transformer-fastest-validator/transformer" }
    ]
  },
  // ...
}
```

### What can be transformed

Currently transformer can handle:

Take a look at [tests](https://github.com/ipetrovic11/ts-transformer-fastest-validator/tree/main/test) for all possibilities.
All cases from fastest-validator should be covered, if not please report the issue.

# License

MIT

[travis-image]:https://travis-ci.org/ipetrovic11/ts-transformer-fastest-validator.svg?branch=master
[travis-url]:https://travis-ci.org/ipetrovic11/ts-transformer-fastest-validator
[npm-image]:https://img.shields.io/npm/v/ts-transformer-fastest-validator.svg?style=flat
[npm-url]:https://www.npmjs.com/package/ts-transformer-fastest-validator
