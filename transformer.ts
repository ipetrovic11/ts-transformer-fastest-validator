import * as ts from 'typescript';
import { isArrayBufferView } from 'util/types';

const predefined: { [name: string]: string } = {
    ICurrency: 'currency',  // https://github.com/icebob/fastest-validator#currency
    IDate: 'date',          // https://github.com/icebob/fastest-validator#date
    IEmail: 'email',        // https://github.com/icebob/fastest-validator#email
    IForbidden: 'forbidden',// https://github.com/icebob/fastest-validator#forbidden
    IMac: 'mac',            // https://github.com/icebob/fastest-validator#mac
    IUrl: 'url',            // https://github.com/icebob/fastest-validator#url
    IUUID: 'uuid',          // https://github.com/icebob/fastest-validator#uuid
    IObjectID: 'objectID',  // https://github.com/icebob/fastest-validator#objectid
};

/**
 * Transform logic
 */

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitEach(file, program, context);
};


function visitEach(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitEach(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;
function visitEach(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  return ts.visitEachChild(visitNode(node, program, context), (childNode) =>
    visitEach(childNode, program, context), context);
}

function visitNode(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {

    // Skip if node is not function call expression
    if (!ts.isCallExpression(node)) { 
        return node; 
    }

    const typeChecker = program.getTypeChecker();
    const signature = typeChecker.getResolvedSignature(node);
    const declaration = signature?.declaration;

    if(declaration && ts.isFunctionDeclaration(declaration)) {
        const name = declaration.name?.getText();

        // If function name is schema and has first type argument process transformation
        if(name === 'convertToSchema' && node.typeArguments && node.typeArguments[0]) {
            const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
            return convert(type, typeChecker, node, context.factory, new Set<string>());
        }
    }

    return node;
}

/**
 * Convert evaluates type and uses proper function based on the type
 */
function convert(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.PrimaryExpression {

    let result:  ts.ArrayLiteralExpression | ts.ObjectLiteralExpression;
    const flags = type.flags;
    const name = (type as ts.ObjectType).symbol?.name;

    if(flags === ts.TypeFlags.Never || 
        flags === ts.TypeFlags.Undefined ||
        flags === ts.TypeFlags.Null) {
        // Convert to never like null, undefined
        result = convertNever(type, typeChecker, node, factory, history);

    } else if(flags & ts.TypeFlags.Literal) {
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

    } else if (flags & ts.TypeFlags.StringLike ||
        flags & ts.TypeFlags.NumberLike ||
        flags & ts.TypeFlags.BooleanLike) {
            // Convert primitive types like number/string/boolean
            result = convertPrimitive(type, typeChecker, node, factory, history);

    } else if (flags === ts.TypeFlags.Any ||
            flags & ts.TypeFlags.VoidLike) {
                // Convert Any
                result = convertAny(type, typeChecker, node, factory, history);

    } else if (flags === ts.TypeFlags.Object &&
        (typeChecker as any).isArrayType(type)) {
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
        ...(type.symbol?.getJsDocTags() || []),
        ...(type.aliasSymbol?.getJsDocTags() || [])
    ];
    if(annotations.length) {
        return applyJSDoc(annotations, result, typeChecker, factory);
    }


    return result;
}

/**
 *  Literal types are converted to https://github.com/icebob/fastest-validator#equal
 */
function convertLiteral(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {
    
    const properties = [];
    const literalValue = parseLiteral(type, typeChecker, node, factory);

    properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('equal')));
    properties.push(factory.createPropertyAssignment('value', literalValue));
    properties.push(factory.createPropertyAssignment('strict', factory.createTrue()));

    if (history.size === 0) {
        properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
    }

    return factory.createObjectLiteralExpression(properties);
}

/**
 * Predefineds interfaces could be found in 'predefined' constant
 */
function convertPredefined(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const name = (type as ts.ObjectType).symbol.name;
        const properties = [];

        properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral(predefined[name])));

        if (history.size === 0) {
            properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
        }

        return factory.createObjectLiteralExpression(properties);
}

/**
 * Instance of class Buffer
 */
 function convertBuffer(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const properties = [];

        properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('class')));
        properties.push(factory.createPropertyAssignment('instanceOf', factory.createIdentifier('Buffer')));

        if (history.size === 0) {
            properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
        }

        return factory.createObjectLiteralExpression(properties);
}

/**
 * Primities could be converted to one of:
 * https://github.com/icebob/fastest-validator#boolean
 * https://github.com/icebob/fastest-validator#number
 * https://github.com/icebob/fastest-validator#string
 */
function convertPrimitive(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {
    
    const properties = [];

    const type_string = typeChecker.typeToString(type);
    properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral(type_string)));
    
    if (history.size === 0) {
        properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
    }

    return factory.createObjectLiteralExpression(properties);
}

/**
 * Any is converted to https://github.com/icebob/fastest-validator#any
 */
function convertAny(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const properties = [];
        properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('any')));
        
        if (history.size === 0) {
            properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
        }
    
        return factory.createObjectLiteralExpression(properties);
}

/**
 * Any is converted to https://github.com/icebob/fastest-validator#forbidden
 */
 function convertNever(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const properties = [];
        properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('forbidden')));
        
        if (history.size === 0) {
            properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
        }
    
        return factory.createObjectLiteralExpression(properties);
}

/**
 * Array is convereted to https://github.com/icebob/fastest-validator#array
 */
function convertArray(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const properties = [];
        const types = (type as ts.TypeReference).typeArguments;

        // Creating annonimous history for case when multi is root
        if (history.size === 0) {
            properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
            history.add(undefined);
        }
        
        if (types && types.length && 
            !(types[0].flags & ts.TypeFlags.Any)) {
                // Convert regular arrays
                properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('array')));
                properties.push(factory.createPropertyAssignment('items', convert(types[0], typeChecker, node, factory, history)));

        } else {
            // Convert in case of Array<any>, any[]
            properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('array')));

        }    
    
    return factory.createObjectLiteralExpression(properties);
}

/**
 * Object is converted to https://github.com/icebob/fastest-validator#object
 */
function convertObject(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const size = history.size;
        const name = (type as ts.ObjectType).symbol.name;

        if(name && name !== '__type' && history.has(name)) {
            return factory.createObjectLiteralExpression([
                factory.createPropertyAssignment('type', factory.createStringLiteral('any'))
              ]);
        }
        
        history.add(name);

        const props = typeChecker.getPropertiesOfType(type)
            .filter((property: ts.Symbol) => {
                const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
                return !!propertyType;
            })
            .map((property: ts.Symbol) => {
                const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
                let resolvedType = convert(propertyType, typeChecker, node, factory, history);

                // Apply annotations
                const annotations: ts.JSDocTagInfo[] = property.getJsDocTags() || [];
                if(annotations.length) {
                    resolvedType = applyJSDoc(annotations, resolvedType as ts.ObjectLiteralExpression, typeChecker, factory)
                }

                // Apply optional via questionToken
                if(property.declarations && property.declarations[0] && (property.declarations[0] as ts.ParameterDeclaration).questionToken) {
                    resolvedType = applyOptional(resolvedType as any, factory);
                }

                return factory.createPropertyAssignment(property.name, resolvedType);
            });

        history.delete(name);

        if(size === 0) {
            return factory.createObjectLiteralExpression(props);
        } else {
            const properties: ts.PropertyAssignment[] = [];
            
            properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('object')));

            if(props.length) {
                properties.push(factory.createPropertyAssignment('props', factory.createObjectLiteralExpression(props)));
            }
            
            return factory.createObjectLiteralExpression(properties); 
        }
}

/**
 * Enum is converted to https://github.com/icebob/fastest-validator#enum
 */
function convertEnum(type: ts.EnumType, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const unionType = type as ts.UnionOrIntersectionType;
        const types = unionType.types || [];
        const properties = [];
        

        properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('enum')));
        properties.push(factory.createPropertyAssignment('values', factory.createArrayLiteralExpression(
            types.filter((type) => !(type.flags & ts.TypeFlags.Undefined))
                .map((type) => parseLiteral(type, typeChecker, node, factory))
        )));

        if (history.size === 0) {
            properties.push(factory.createPropertyAssignment('$$root', factory.createTrue()));
        }

        return factory.createObjectLiteralExpression(properties);
}

/**
 * Union is convereted to https://github.com/icebob/fastest-validator#multi
 */
function convertUnion(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ArrayLiteralExpression | ts.ObjectLiteralExpression {
        const unionType = type as ts.UnionOrIntersectionType;

        // Ignoring undefined as a type as it represents optional type
        let optional = false;
        let nullable = false;
        const types = unionType.types.filter((type) => {
            if(type.flags & ts.TypeFlags.Undefined) {
                optional = true;
                return false;
            }

            if(type.flags & ts.TypeFlags.Null) {
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

        if(allLiterals) {
            let result: any = (types.length === 1)
                ? convertLiteral(types[0], typeChecker, node, factory, history)
                : convertEnum(type, typeChecker, node, factory, history);

            if(optional) {
                result = applyOptional(result, factory);
            }

            if(nullable) {
                result = applyNullable(result, factory);
            }

            return result;
        }
        
        // Creating annonimous history for case when multi is root
        history.add(undefined);


        // In case of optional or nullable it is possible to stay with only one element
        if (types.length === 1) {
            let result: any = convert(types[0], typeChecker, node, factory, history);
    
            if(optional) {
                result = applyOptional(result, factory);
            }

            if(nullable) {
                result = applyNullable(result, factory);
            }

            return result;
        } else {
            return factory.createArrayLiteralExpression(types
                .map((type) => {
                    let result: any = convert(type, typeChecker, node, factory, history);
    
                    if(optional) {
                        result = applyOptional(result, factory);
                    }
        
                    if(nullable) {
                        result = applyNullable(result, factory);
                    }
    
                    return result;
                }
            ));
        }
}

/**
 * Intersection is converted to https://github.com/icebob/fastest-validator#object
 */
function convertIntersection(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory, history: Set<string | undefined>): ts.ObjectLiteralExpression {

        const size = history.size;

        const unionType = type as ts.UnionOrIntersectionType;
        const types = unionType.types || [];

        const props: ts.PropertyAssignment[] = [];
        const propsRegistry = new Set<string>();

        // Resolve properties for each type
        types.reverse().forEach((type) => {
            const name = (type as ts.ObjectType).symbol?.name;

            history.add(name);
            typeChecker.getPropertiesOfType(type)
                .filter((property: ts.Symbol) => {
                    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
                    return !!propertyType;
                })
                .forEach((property) => {

                    if(type.flags & ts.TypeFlags.StringLike ||
                        type.flags & ts.TypeFlags.NumberLike ||
                        type.flags & ts.TypeFlags.BooleanLike || 
                        type.flags & ts.TypeFlags.Literal ) {
                        throw new Error('Can\'t intersect literal or primitive!')
                    }

                    // Ignor duplicated/overriden props
                    if(propsRegistry.has(property.name)) {
                        return;
                    } else {
                        propsRegistry.add(property.name)
                    }

                    const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, node);
                    let resolvedType = convert(propertyType, typeChecker, node, factory, history);

                    // Apply annotations
                    const annotations: ts.JSDocTagInfo[] = property.getJsDocTags() || [];
                    if(annotations.length) {
                        resolvedType = applyJSDoc(annotations, resolvedType as ts.ObjectLiteralExpression, typeChecker, factory);
                    }

                    // Apply optional via questionToken
                    if(property.declarations && property.declarations[0] && (property.declarations[0] as ts.ParameterDeclaration).questionToken) {
                        resolvedType = applyOptional(resolvedType as any, factory);
                    }
                        
                    props.push(factory.createPropertyAssignment(property.name, resolvedType));
                })
            history.delete(name);
        });

        if(size === 0) {
            return factory.createObjectLiteralExpression(props);
        } else {
            const properties: ts.PropertyAssignment[] = [];

            properties.push(factory.createPropertyAssignment('type', factory.createStringLiteral('object')));
            properties.push(factory.createPropertyAssignment('props', factory.createObjectLiteralExpression(props)));

            return factory.createObjectLiteralExpression(properties); 
        }
}

/**
 * Adds optional property to an object or an array of objects
 */
function applyOptional(type: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, 
    factory: ts.NodeFactory): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
        if(ts.isObjectLiteralExpression(type)) {

            const exists = type.properties.find(one => {
                const name = (one.name as ts.Identifier);
                return name?.escapedText === 'optional';
            });

            if(exists) {
                return type;
            }

            return factory.updateObjectLiteralExpression(type, [
                ... type.properties,
                factory.createPropertyAssignment('optional', factory.createTrue())
            ]);
        } else if(ts.isArrayLiteralExpression(type)) {
            return factory.updateArrayLiteralExpression(type, type.elements.map((element: any) => {
                return applyOptional(element, factory)
            }));
        }
        
        return type;
}

/**
 * Adds nullable property to an object or an array of objects
 */
 function applyNullable(type: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, 
    factory: ts.NodeFactory): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
        if(ts.isObjectLiteralExpression(type)) {

            const exists = type.properties.find(one => {
                const name = (one.name as ts.Identifier);
                return name?.escapedText === 'nullable';
            });

            if(exists) {
                return type;
            }

            return factory.updateObjectLiteralExpression(type, [
                ... type.properties,
                factory.createPropertyAssignment('nullable', factory.createTrue())
            ]);
        } else if(ts.isArrayLiteralExpression(type)) {
            return factory.updateArrayLiteralExpression(type, type.elements.map((element: any) => {
                return applyOptional(element, factory)
            }));
        }
        
        return type;
}

/**
 * Adds annotations as properties to an object or an array of objects
 */
function applyJSDoc(annotations: ts.JSDocTagInfo[], type: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression, 
    typeChecker: ts.TypeChecker, factory: ts.NodeFactory): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {

        const properties: ts.PropertyAssignment[] = annotations.filter(annotation => annotation.text)
            .map(annotation => {
                const text = (annotation.text as unknown as any);

                const value = Array.isArray(text)
                    ? text[0].text
                    : text;
                let literalValue: ts.LiteralExpression | ts.TrueLiteral | ts.FalseLiteral;

                if(value === 'true') {
                    literalValue = factory.createTrue();
                } else if(value === 'false') {
                    literalValue = factory.createFalse();
                } else if(+value) {
                    literalValue = factory.createNumericLiteral(+value);
                } else {
                    literalValue = factory.createStringLiteral(value);
                }

                return factory.createPropertyAssignment(annotation.name, literalValue);
            });
    
        if(ts.isObjectLiteralExpression(type)) {
            return factory.updateObjectLiteralExpression(type, [
                ... type.properties,
                ... properties
            ]);
        } else if(ts.isArrayLiteralExpression(type)) {
            return factory.updateArrayLiteralExpression(type, type.elements.map((element: any) => {
                return applyJSDoc(annotations, element, typeChecker, factory)
            }));
        }
    
    return type;
}

/**
 * Parsing means making elements exactly like they should be, without coverting
 */
function parseLiteralBoolean(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory): ts.StringLiteral | ts.NumericLiteral | ts.TrueLiteral | ts.FalseLiteral {

    const type_string = typeChecker.typeToString(type);

    if(type_string === 'true') {
        return factory.createTrue();
    } else {
        return factory.createFalse();
    }
}

function parseLiteral(type: ts.Type, typeChecker: ts.TypeChecker, 
    node: ts.Node, factory: ts.NodeFactory): ts.StringLiteral | ts.NumericLiteral | ts.TrueLiteral | ts.FalseLiteral {

    if(type.flags & ts.TypeFlags.BooleanLike) {
        return parseLiteralBoolean(type, typeChecker, node, factory);
    }

    const literalType = type as ts.LiteralType;
    const value = literalType.value;

    switch (typeof value) {
        case 'string':
            return factory.createStringLiteral((type as any).value.toString());
        case 'number':
            return factory.createNumericLiteral(+(type as any).value);
        default:
            throw new Error('Unknow literal type ' + value)
    }
}