type A_Identifier = {
  type: "Identifier";
  name: string;
};
type A_Literal = {
  type: "Literal";
  value: null | boolean | number | string;
};

type A_ExpressionStatement = {
  type: "ExpressionStatement";
  expression: any;
};
type A_AssignmentExpression = {
  type: "AssignmentExpression";
  operator: "=";
  left: any;
  right: any;
};
type A_ArrayExpression = {
  type: "ArrayExpression";
  elements: any[];
};
type A_ArrowFunctionExpression = {
  type: "ArrowFunctionExpression";
  body: A_BlockStatement;
};
type A_BinaryExpression = {
  type: "BinaryExpression";
  operator: string;
  left: any;
  right: any;
};
type A_BlockStatement = {
  type: "BlockStatement";
  body: any[];
};
type A_CallExpression = {
  type: "CallExpression";
  callee?: any;
  arguments: any[];
};
type A_IfStatement = {
  type: "IfStatement";
  test: any;
};

type A_MemberExpression = {
  type: "MemberExpression";
  object: any;
  property: any;
};
type A_Program = {
  type: "Program";
  body: any[];
};
type A_UnaryExpression = {
  type: "UnaryExpression";
  operator: string;
  argument: any;
};
type A_UpdateExpression = {
  type: "UpdateExpression";
  operator: any;
  argument: any;
  prefix: boolean;
};
type A_VariableDeclaration = {
  type: "VariableDeclaration";
  declarations: any;
  kind: string;
};
