import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function getPropertyNameText(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  if (ts.isComputedPropertyName(name)) {
    return name.expression.getText(sourceFile);
  }

  return name.getText(sourceFile);
}

function expressionToValue(expression, sourceFile) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  if (ts.isNumericLiteral(expression)) {
    return Number(expression.text);
  }

  if (ts.isPrefixUnaryExpression(expression) && ts.isNumericLiteral(expression.operand)) {
    const value = Number(expression.operand.text);
    if (expression.operator === ts.SyntaxKind.MinusToken) {
      return -value;
    }

    if (expression.operator === ts.SyntaxKind.PlusToken) {
      return value;
    }
  }

  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map((element) => expressionToValue(element, sourceFile));
  }

  if (ts.isObjectLiteralExpression(expression)) {
    return expression.properties.reduce((result, property) => {
      if (!ts.isPropertyAssignment(property)) {
        return result;
      }

      const key = getPropertyNameText(property.name, sourceFile);
      result[key] = expressionToValue(property.initializer, sourceFile);
      return result;
    }, {});
  }

  throw new Error(`Unsupported metadata expression in ${sourceFile.fileName}: ${expression.getText(sourceFile)}`);
}

function getObjectPropertyValue(objectLiteral, name, sourceFile) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    if (getPropertyNameText(property.name, sourceFile) !== name) {
      continue;
    }

    return expressionToValue(property.initializer, sourceFile);
  }

  return undefined;
}

function findDefinitionsArray(sourceFile) {
  let definitionArray = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'definitions' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      definitionArray = node.initializer;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!definitionArray) {
    throw new Error(`Unable to locate definitions array in ${sourceFile.fileName}`);
  }

  return definitionArray;
}

export function loadComponentDefinitionLiterals(sourcePath) {
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const definitionArray = findDefinitionsArray(sourceFile);

  return definitionArray.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`Expected component definition object in ${sourcePath}`);
    }

    return {
      id: getObjectPropertyValue(element, 'id', sourceFile),
      name: getObjectPropertyValue(element, 'name', sourceFile),
      category: getObjectPropertyValue(element, 'category', sourceFile),
      description: getObjectPropertyValue(element, 'description', sourceFile) ?? '',
      aliases: getObjectPropertyValue(element, 'aliases', sourceFile) ?? [],
      placeable: getObjectPropertyValue(element, 'placeable', sourceFile) !== false,
      defaultState: getObjectPropertyValue(element, 'defaultProperties', sourceFile) ?? {},
    };
  });
}

export function loadCatalogOverrides(overridesPath) {
  return JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

function uniqueLowercaseStrings(values) {
  return [...new Set(uniqueStrings(values).map((value) => value.toLowerCase()))];
}

export function buildCircuitMetadata(definitions, overrides) {
  const categoryOrder = overrides.categoryOrder ?? [];
  const categoryLabels = overrides.categoryLabels ?? {};
  const componentOverrides = overrides.components ?? {};

  const metadata = definitions.map((definition) => {
    const override = componentOverrides[definition.id] ?? {};
    const aliases = uniqueStrings([...(definition.aliases ?? []), ...(override.aliases ?? [])]);
    const keywords = uniqueLowercaseStrings([
      ...(override.keywords ?? []),
      definition.name,
      definition.id,
      definition.category,
      ...aliases,
    ]);

    return {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      description: override.description ?? definition.description ?? definition.name,
      aliases,
      keywords,
      placeable: override.placeable ?? definition.placeable !== false,
      singleton: Boolean(override.singleton),
      previewSourceKey: override.previewSourceKey ?? definition.id,
      defaultState: override.defaultState ?? definition.defaultState ?? {},
      propertySchema: override.propertySchema ?? { fields: [] },
    };
  });

  return {
    categoryOrder,
    categoryLabels,
    metadata,
  };
}

export function resolveCircuitCatalogPaths(repoRoot) {
  return {
    definitionsPath: path.join(repoRoot, 'apps', 'web', 'src', 'lib', 'wiring', 'componentDefinitions.ts'),
    overridesPath: path.join(repoRoot, 'apps', 'web', 'scripts', 'circuit-component-metadata.overrides.json'),
    generatedPath: path.join(
      repoRoot,
      'apps',
      'web',
      'src',
      'lib',
      'wiring',
      'generated',
      'circuitComponentMetadata.generated.ts'
    ),
  };
}

export function loadLiteralExports(sourcePath, exportNames) {
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const requested = new Set(exportNames);
  const results = {};

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (!isExported) {
        return ts.forEachChild(node, visit);
      }

      node.declarationList.declarations.forEach((declaration) => {
        if (!ts.isIdentifier(declaration.name) || !requested.has(declaration.name.text) || !declaration.initializer) {
          return;
        }

        results[declaration.name.text] = expressionToValue(declaration.initializer, sourceFile);
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

