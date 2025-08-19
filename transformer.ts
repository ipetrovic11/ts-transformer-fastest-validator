import * as ts from 'typescript';

const predefined: { [name: string]: string } = {
  ICurrency: 'currency', // https://github.com/icebob/fastest-validator#currency zmaj
  IDate: 'date', // https://github.com/icebob/fastest-validator#date
  IEmail: 'email', // https://github.com/icebob/fastest-validator#email
  IForbidden: 'forbidden', // https://github.com/icebob/fastest-validator#forbidden
  IMac: 'mac', // https://github.com/icebob/fastest-validator#mac
  IUrl: 'url', // https://github.com/icebob/fastest-validator#url
  IUUID: 'uuid', // https://github.com/icebob/fastest-validator#uuid
  IObjectID: 'objectID', // https://github.com/icebob/fastest-validator#objectid
};

/**
 * Transform logic
 */

export default function transformer(
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
    visitEach(file, program, context);
}

function visitEach(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.SourceFile;
function visitEach(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node;
function visitEach(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node {
  return ts.visitEachChild(
    visitNode(node, program, context),
    (childNode) => visitEach(childNode, program, context),
    context,
  );
}

function visitNode(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node {
  // Skip if node is not function call expression
  if (!ts.isCallExpression(node)) {
    return node;
  }

  const typeChecker = program.getTypeChecker();
  const signature = typeChecker.getResolvedSignature(node);
  const declaration = signature?.declaration;

  if (declaration && ts.isFunctionDeclaration(declaration)) {
    const name = declaration.name?.getText();

    // If function name is schema and has first type argument process transformation
    if (
      name === 'convertToSchema' &&
      node.typeArguments &&
      node.typeArguments[0]
    ) {
      const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
      return convert(
        type,
        typeChecker,
        node,
        context.factory,
        new Set<string>(),
      );
    }
  }

  return node;
}

/**
 * Convert evaluates type and uses proper function based on the type
 */
function convert(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.PrimaryExpression {
  // Guard against undefined type in edge cases
  if (!type) {
    return factory.createObjectLiteralExpression([
      factory.createPropertyAssignment(
        'type',
        factory.createStringLiteral('any'),
      ),
    ]);
  }
  let result: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression;
  const flags = type.flags;
  const name = (type as ts.ObjectType).symbol?.name;

  if (
    flags === ts.TypeFlags.Never ||
    flags === ts.TypeFlags.Undefined ||
    flags === ts.TypeFlags.Null
  ) {
    // Convert to never like null, undefined
    result = convertNever(type, typeChecker, node, factory, history);
  } else if (flags & ts.TypeFlags.Literal) {
    // Convert literals like true/false/1/20/'example'
    result = convertLiteral(type, typeChecker, node, factory, history);
  } else if (name && predefined.hasOwnProperty(name)) {
    // Convert predefined
    result = convertPredefined(type, typeChecker, node, factory, history);
  } else if (name && name === 'Buffer') {
    // Convert buffer
    result = convertBuffer(type, typeChecker, node, factory, history);
  } else if (flags & ts.TypeFlags.EnumLike) {
    // Convert Enum
    result = convertEnum(type, typeChecker, node, factory, history);
  } else if (
    flags & ts.TypeFlags.StringLike ||
    flags & ts.TypeFlags.NumberLike ||
    flags & ts.TypeFlags.BooleanLike
  ) {
    // Convert primitive types like number/string/boolean
    result = convertPrimitive(type, typeChecker, node, factory, history);
  } else if (flags === ts.TypeFlags.Any || flags & ts.TypeFlags.VoidLike) {
    // Convert Any
    result = convertAny(type, typeChecker, node, factory, history);
  } else if (
    flags === ts.TypeFlags.Object &&
    (typeChecker as any).isArrayType(type)
  ) {
    // Convert array
    result = convertArray(type, typeChecker, node, factory, history);
  } else if (flags === ts.TypeFlags.Object) {
    // Convert objects like interface/type
    result = convertObject(type, typeChecker, node, factory, history);
  } else if (flags === ts.TypeFlags.Union) {
    // Convert union like Type1 | Type2
    result = convertUnion(type, typeChecker, node, factory, history);
  } else if (flags === ts.TypeFlags.Intersection) {
    // Convert objects like interface/type
    result = convertIntersection(type, typeChecker, node, factory, history);
  } else {
    throw Error('Unknown type');
  }

  // Apply annotations
  const annotations: ts.JSDocTagInfo[] = [
    ...extractJsDocTagInfos(type.symbol),
    ...extractJsDocTagInfos(type.aliasSymbol),
  ];
  if (annotations.length) {
    return applyJSDoc(annotations, result, typeChecker, factory);
  }

  return result;
}

/**
 *  Literal types are converted to https://github.com/icebob/fastest-validator#equal
 */
function convertLiteral(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties = [];
  const literalValue = parseLiteral(type, typeChecker, node, factory);

  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral('equal'),
    ),
  );
  properties.push(factory.createPropertyAssignment('value', literalValue));
  properties.push(
    factory.createPropertyAssignment('strict', factory.createTrue()),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Predefineds interfaces could be found in 'predefined' constant
 */
function convertPredefined(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const name = (type as ts.ObjectType).symbol.name;
  const properties = [];

  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral(predefined[name]),
    ),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Instance of class Buffer
 */
function convertBuffer(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties = [];

  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral('class'),
    ),
  );
  properties.push(
    factory.createPropertyAssignment(
      'instanceOf',
      factory.createIdentifier('Buffer'),
    ),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Primities could be converted to one of:
 * https://github.com/icebob/fastest-validator#boolean
 * https://github.com/icebob/fastest-validator#number
 * https://github.com/icebob/fastest-validator#string
 */
function convertPrimitive(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties = [];

  const type_string = typeChecker.typeToString(type);
  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral(type_string),
    ),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Any is converted to https://github.com/icebob/fastest-validator#any
 */
function convertAny(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties = [];
  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral('any'),
    ),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Any is converted to https://github.com/icebob/fastest-validator#forbidden
 */
function convertNever(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties = [];
  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral('forbidden'),
    ),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Array is convereted to https://github.com/icebob/fastest-validator#array
 */
function convertArray(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties = [];
  const types = (type as ts.TypeReference).typeArguments;

  // Creating annonimous history for case when multi is root
  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
    history.add(undefined);
  }

  if (types && types.length && !(types[0].flags & ts.TypeFlags.Any)) {
    // Convert regular arrays
    properties.push(
      factory.createPropertyAssignment(
        'type',
        factory.createStringLiteral('array'),
      ),
    );
    properties.push(
      factory.createPropertyAssignment(
        'items',
        convert(types[0], typeChecker, node, factory, history),
      ),
    );
  } else {
    // Convert in case of Array<any>, any[]
    properties.push(
      factory.createPropertyAssignment(
        'type',
        factory.createStringLiteral('array'),
      ),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Object is converted to https://github.com/icebob/fastest-validator#object
 */
function convertObject(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const size = history.size;
  const name = (type as ts.ObjectType).symbol.name;

  if (name && name !== '__type' && history.has(name)) {
    return factory.createObjectLiteralExpression([
      factory.createPropertyAssignment(
        'type',
        factory.createStringLiteral('any'),
      ),
    ]);
  }

  history.add(name);

  const props = typeChecker
    .getPropertiesOfType(type)
    .filter((property: ts.Symbol) => {
      const propertyType = typeChecker.getTypeOfSymbolAtLocation(
        property,
        node,
      );
      return !!propertyType;
    })
    .map((property: ts.Symbol) => {
      const propertyType = typeChecker.getTypeOfSymbolAtLocation(
        property,
        node,
      );
      let resolvedType = convert(
        propertyType,
        typeChecker,
        node,
        factory,
        history,
      );

      // Apply annotations
      const annotations: ts.JSDocTagInfo[] = extractJsDocTagInfos(property);
      if (annotations.length) {
        resolvedType = applyJSDoc(
          annotations,
          resolvedType as ts.ObjectLiteralExpression,
          typeChecker,
          factory,
        );
      }

      // Apply optional via questionToken
      if (
        property.declarations &&
        property.declarations[0] &&
        (property.declarations[0] as ts.ParameterDeclaration).questionToken
      ) {
        resolvedType = applyOptional(resolvedType as any, factory);
      }

      return factory.createPropertyAssignment(property.name, resolvedType);
    });

  history.delete(name);

  if (size === 0) {
    return factory.createObjectLiteralExpression(props);
  } else {
    const properties: ts.PropertyAssignment[] = [];

    properties.push(
      factory.createPropertyAssignment(
        'type',
        factory.createStringLiteral('object'),
      ),
    );

    if (props.length) {
      properties.push(
        factory.createPropertyAssignment(
          'props',
          factory.createObjectLiteralExpression(props),
        ),
      );
    }

    return factory.createObjectLiteralExpression(properties);
  }
}

/**
 * Enum is converted to https://github.com/icebob/fastest-validator#enum
 */
function convertEnum(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const properties: ts.PropertyAssignment[] = [];

  // Collect literal member types either from a union or from enum-like members
  let memberTypes: ts.Type[] = [];

  if (type.flags & ts.TypeFlags.Union) {
    memberTypes = (type as ts.UnionType).types;
  } else {
    // Fallback for EnumLike types which are not unions in the type system
    const props = typeChecker.getPropertiesOfType(type);
    memberTypes = props
      .map((symbol) => typeChecker.getTypeOfSymbolAtLocation(symbol, node))
      .filter(
        (memberType) =>
          !!(
            memberType &&
            (memberType.flags & ts.TypeFlags.Literal ||
              memberType.flags & ts.TypeFlags.BooleanLike)
          ),
      );
  }

  const values = memberTypes
    .filter((t) => !(t.flags & ts.TypeFlags.Undefined))
    .map((t) => parseLiteral(t, typeChecker, node, factory));

  properties.push(
    factory.createPropertyAssignment(
      'type',
      factory.createStringLiteral('enum'),
    ),
  );
  properties.push(
    factory.createPropertyAssignment(
      'values',
      factory.createArrayLiteralExpression(values),
    ),
  );

  if (history.size === 0) {
    properties.push(
      factory.createPropertyAssignment('$$root', factory.createTrue()),
    );
  }

  return factory.createObjectLiteralExpression(properties);
}

/**
 * Union is convereted to https://github.com/icebob/fastest-validator#multi
 */
function convertUnion(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ArrayLiteralExpression | ts.ObjectLiteralExpression {
  const unionType = type as ts.UnionOrIntersectionType;

  // Ignoring undefined as a type as it represents optional type
  let optional = false;
  let nullable = false;
  const types = unionType.types.filter((type) => {
    if (type.flags & ts.TypeFlags.Undefined) {
      optional = true;
      return false;
    }

    if (type.flags & ts.TypeFlags.Null) {
      nullable = true;
      return false;
    }

    return true;
  });

  // Optimization if all union members are literals create an enum
  let allLiterals = true;
  types.forEach((type) => {
    const literal = type.flags & ts.TypeFlags.Literal;
    allLiterals = allLiterals && !!literal;
  });

  if (allLiterals) {
    let result: any =
      types.length === 1
        ? convertLiteral(types[0], typeChecker, node, factory, history)
        : convertEnum(type, typeChecker, node, factory, history);

    if (optional) {
      result = applyOptional(result, factory);
    }

    if (nullable) {
      result = applyNullable(result, factory);
    }

    return result;
  }

  // Creating annonimous history for case when multi is root
  history.add(undefined);

  // In case of optional or nullable it is possible to stay with only one element
  if (types.length === 1) {
    let result: any = convert(types[0], typeChecker, node, factory, history);

    if (optional) {
      result = applyOptional(result, factory);
    }

    if (nullable) {
      result = applyNullable(result, factory);
    }

    return result;
  } else {
    return factory.createArrayLiteralExpression(
      types.map((type) => {
        let result: any = convert(type, typeChecker, node, factory, history);

        if (optional) {
          result = applyOptional(result, factory);
        }

        if (nullable) {
          result = applyNullable(result, factory);
        }

        return result;
      }),
    );
  }
}

/**
 * Intersection is converted to https://github.com/icebob/fastest-validator#object
 */
function convertIntersection(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
  history: Set<string | undefined>,
): ts.ObjectLiteralExpression {
  const size = history.size;

  const unionType = type as ts.UnionOrIntersectionType;
  const types = unionType.types || [];

  const propsRegistry = new Map<string, ts.Symbol[]>();

  // First, collect all properties from all intersected types
  types.forEach((type) => {
    if (
      type.flags & ts.TypeFlags.StringLike ||
      type.flags & ts.TypeFlags.NumberLike ||
      type.flags & ts.TypeFlags.BooleanLike ||
      type.flags & ts.TypeFlags.Literal
    ) {
      throw new Error("Can't intersect literal or primitive!");
    }

    const name = (type as ts.ObjectType).symbol?.name;
    history.add(name);

    typeChecker
      .getPropertiesOfType(type)
      .filter((property: ts.Symbol) => {
        const propertyType = typeChecker.getTypeOfSymbolAtLocation(
          property,
          node,
        );
        return !!propertyType;
      })
      .forEach((property) => {
        // Collect properties for each property
        if (!propsRegistry.has(property.name)) {
          propsRegistry.set(property.name, []);
        }

        propsRegistry.get(property.name)!.push(property);
      });
  });

  // Now process all collected properties
  const props: ts.PropertyAssignment[] = Array.from(
    propsRegistry.entries(),
  ).map(([name, properties]) => {
    let resolvedType: ts.PrimaryExpression;

    if (properties.length === 1) {
      // Single property - convert normally
      const propertyType = typeChecker.getTypeOfSymbolAtLocation(
        properties[0],
        node,
      );
      resolvedType = convert(propertyType, typeChecker, node, factory, history);
    } else {
      // Multiple properties - merge property type from intersection
      const propSymbol = typeChecker.getPropertyOfType(type, name);
      const mergedPropertyType = propSymbol
        ? typeChecker.getTypeOfSymbolAtLocation(propSymbol, node)
        : undefined;
      resolvedType = convert(
        mergedPropertyType as any,
        typeChecker,
        node,
        factory,
        history,
      );
    }

    // Apply any property-level JSDoc annotations if needed
    const annotations: ts.JSDocTagInfo[] = properties.reduce(
      (result: ts.JSDocTagInfo[], property) => {
        const docs = extractJsDocTagInfos(property);
        return result.concat(...docs);
      },
      [],
    );
    if (annotations.length) {
      resolvedType = applyJSDoc(
        annotations,
        resolvedType as ts.ObjectLiteralExpression,
        typeChecker,
        factory,
      );
    }

    // Count how many have optional tag and if all do apply optional
    const optionalCount = properties.reduce((result, property) => {
      if (
        property.declarations &&
        property.declarations[0] &&
        (property.declarations[0] as ts.ParameterDeclaration).questionToken
      ) {
        return result + 1;
      }
      return result;
    }, 0);
    if (properties.length === optionalCount) {
      resolvedType = applyOptional(resolvedType as any, factory);
    }

    history.delete(name);
    return factory.createPropertyAssignment(name, resolvedType);
  });

  if (size === 0) {
    return factory.createObjectLiteralExpression(props);
  } else {
    const properties: ts.PropertyAssignment[] = [];

    properties.push(
      factory.createPropertyAssignment(
        'type',
        factory.createStringLiteral('object'),
      ),
    );
    properties.push(
      factory.createPropertyAssignment(
        'props',
        factory.createObjectLiteralExpression(props),
      ),
    );

    return factory.createObjectLiteralExpression(properties);
  }
}

/**
 * Adds optional property to an object or an array of objects
 */
function applyOptional(
  type: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
  factory: ts.NodeFactory,
): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
  if (ts.isObjectLiteralExpression(type)) {
    const exists = type.properties.find((one) => {
      const name = one.name as ts.Identifier;
      return name?.escapedText === 'optional';
    });

    if (exists) {
      return type;
    }

    return factory.updateObjectLiteralExpression(type, [
      ...type.properties,
      factory.createPropertyAssignment('optional', factory.createTrue()),
    ]);
  } else if (ts.isArrayLiteralExpression(type)) {
    return factory.updateArrayLiteralExpression(
      type,
      type.elements.map((element: any) => {
        return applyOptional(element, factory);
      }),
    );
  }

  return type;
}

/**
 * Adds nullable property to an object or an array of objects
 */
function applyNullable(
  type: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
  factory: ts.NodeFactory,
): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
  if (ts.isObjectLiteralExpression(type)) {
    const exists = type.properties.find((one) => {
      const name = one.name as ts.Identifier;
      return name?.escapedText === 'nullable';
    });

    if (exists) {
      return type;
    }

    return factory.updateObjectLiteralExpression(type, [
      ...type.properties,
      factory.createPropertyAssignment('nullable', factory.createTrue()),
    ]);
  } else if (ts.isArrayLiteralExpression(type)) {
    return factory.updateArrayLiteralExpression(
      type,
      type.elements.map((element: any) => {
        return applyOptional(element, factory);
      }),
    );
  }

  return type;
}

/**
 * Adds annotations as properties to an object or an array of objects
 */
function applyJSDoc(
  annotations: ts.JSDocTagInfo[],
  type: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
  typeChecker: ts.TypeChecker,
  factory: ts.NodeFactory,
): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
  const properties: ts.PropertyAssignment[] = annotations
    .filter(
      (annotation) => (annotation as any).text || (annotation as any).name,
    )
    .map((annotation) => {
      const anyAnno: any = annotation as any;
      const rawText = anyAnno.text as unknown as any;

      // Normalize TS tag text: it can be string or array of parts
      const firstPart: any = Array.isArray(rawText)
        ? rawText.length
          ? rawText[0]
          : undefined
        : rawText;
      const textValue: string =
        firstPart != null ? String(firstPart.text ?? firstPart) : '';

      let literalValue: ts.Expression;
      if (textValue === 'true') {
        literalValue = factory.createTrue();
      } else if (textValue === 'false') {
        literalValue = factory.createFalse();
      } else if (/^[+-]?\d+(?:\.\d+)?$/.test(textValue)) {
        const isNegative = textValue.startsWith('-');
        const absStr = isNegative
          ? textValue.slice(1)
          : textValue.startsWith('+')
          ? textValue.slice(1)
          : textValue;
        const numeric = factory.createNumericLiteral(absStr);
        literalValue = isNegative
          ? factory.createPrefixUnaryExpression(
              ts.SyntaxKind.MinusToken,
              numeric,
            )
          : textValue.startsWith('+')
          ? numeric
          : numeric;
      } else {
        literalValue = factory.createStringLiteral(textValue);
      }

      return factory.createPropertyAssignment(anyAnno.name, literalValue);
    });

  if (ts.isObjectLiteralExpression(type)) {
    return factory.updateObjectLiteralExpression(type, [
      ...type.properties,
      ...properties,
    ]);
  } else if (ts.isArrayLiteralExpression(type)) {
    return factory.updateArrayLiteralExpression(
      type,
      type.elements.map((element: any) => {
        return applyJSDoc(annotations, element, typeChecker, factory);
      }),
    );
  }

  return type;
}

/**
 * Parsing means making elements exactly like they should be, without coverting
 */
function parseLiteralBoolean(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
): ts.Expression {
  const type_string = typeChecker.typeToString(type);

  if (type_string === 'true') {
    return factory.createTrue();
  } else {
    return factory.createFalse();
  }
}

function parseLiteral(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  node: ts.Node,
  factory: ts.NodeFactory,
): ts.Expression {
  if (type.flags & ts.TypeFlags.BooleanLike) {
    return parseLiteralBoolean(type, typeChecker, node, factory);
  }
  const literalType = type as any;
  const value = literalType.value;
  switch (typeof value) {
    case 'string':
      return factory.createStringLiteral(String(value));
    case 'number': {
      const n = Number(value);
      if (n < 0) {
        // create negative numbers as prefix unary expression per TS factory requirements
        return factory.createPrefixUnaryExpression(
          ts.SyntaxKind.MinusToken,
          factory.createNumericLiteral(String(Math.abs(n))),
        );
      }
      return factory.createNumericLiteral(String(n));
    }
    default:
      throw new Error('Unknown literal type ' + value);
  }
}

function extractJsDocTagInfos(
  target: ts.Symbol | undefined,
): ts.JSDocTagInfo[] {
  if (!target) return [] as unknown as ts.JSDocTagInfo[];

  // Try legacy API first
  const legacy = (target as any).getJsDocTags
    ? (target as any).getJsDocTags()
    : undefined;
  if (Array.isArray(legacy) && legacy.length) {
    return legacy as ts.JSDocTagInfo[];
  }

  const collected: Array<{ name: string; text?: string }> = [];
  const declarations: readonly ts.Declaration[] | undefined = (target as any)
    .declarations;
  if (!declarations || !declarations.length)
    return collected as unknown as ts.JSDocTagInfo[];

  for (const decl of declarations) {
    const infoTags: any[] = (ts as any).getJSDocTags
      ? (ts as any).getJSDocTags(decl)
      : [];
    if (Array.isArray(infoTags) && infoTags.length) {
      for (const info of infoTags) {
        const tagNameNode: any = (info as any).tagName;
        const name: string =
          (info as any).name ||
          (tagNameNode && (tagNameNode.escapedText as string)) ||
          (tagNameNode && (tagNameNode.text as string)) ||
          '';
        const textRawAny: any = (info as any).text ?? (info as any).comment;
        const text: string | undefined = Array.isArray(textRawAny)
          ? textRawAny.length
            ? String(textRawAny[0].text ?? textRawAny[0])
            : undefined
          : textRawAny != null
          ? String(textRawAny)
          : undefined;
        if (name) collected.push({ name, text });
      }
      continue;
    }

    // Fallback: walk jsDoc nodes
    const jsDocs: any = (decl as any).jsDoc;
    if (Array.isArray(jsDocs)) {
      for (const jsDoc of jsDocs) {
        const tagNodes: any[] = jsDoc.tags || [];
        for (const t of tagNodes) {
          const tagName: any = t.tagName;
          const name: string =
            (tagName && (tagName.escapedText as string)) ||
            (tagName && (tagName.text as string)) ||
            ((t as any).name as string) ||
            '';
          const textRaw: any = (t as any).comment;
          const text: string | undefined =
            textRaw != null ? String(textRaw) : undefined;
          if (name) collected.push({ name, text });
        }
      }
    }

    // Last fallback: parse leading comments for @tag value
    const sourceFile = decl.getSourceFile();
    const fullText = sourceFile.getFullText();
    const ranges = ts.getLeadingCommentRanges(fullText, decl.pos) || [];
    for (const range of ranges) {
      const comment = fullText.slice(range.pos, range.end);
      const regex = /@([\$\w]+)\s+([^\s*]+)/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(comment))) {
        const name = m[1];
        const text = m[2];
        if (name) collected.push({ name, text });
      }
    }
  }

  return collected as unknown as ts.JSDocTagInfo[];
}
