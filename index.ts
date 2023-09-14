// Our Scheme interpreter is implemented in TypeScript, a typed superset of JavaScript.
//
//
// Symbols:
// ------------
// Symbol = str              # A Scheme Symbol is implemented as a Python str
// Number = (int, float)     # A Scheme Number is implemented as a Python int or float
// Atom   = (Symbol, Number) # A Scheme Atom is a Symbol or Number
// List   = list             # A Scheme List is implemented as a Python list
// Exp    = (Atom, List)     # A Scheme expression is an Atom or List
// Env    = dict
//

// Tokenize
// ------------
// Tokenize takes a string of characters and converts it into a list of tokens.
export let tokenize = function (input: string) {
  return input.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
};

// Makes the AST
export let read_from_tokens = function (tokens: string[]): Token | Token[] {
  // First check the length of the tokens
  if (tokens.length == 0) {
    throw "unexpected EOF while reading";
  }

  // Pop the first token
  let token = tokens.shift();

  if (token == "(") {
    // If the token is a left parenthesis, then we start a new expression
    let list: any[] = [];
    while (tokens[0] != ")") {
      list.push(read_from_tokens(tokens));
    }
    tokens.shift(); // pop off ')'
    return list;
  } else if (token == ")") {
    // If the token is a right parenthesis, then we have an error
    throw "unexpected )";
  } else if (token) {
    // Otherwise, we have an atom
    return atom(token);
  } else {
    throw "unexpected token";
  }
};

type Token = AtomNumber | AtomSymbol | AtomBoolean;

interface AtomNumber {
  type: "number";
  value: number;
}

interface AtomSymbol {
  type: "symbol";
  value: string;
}

interface AtomBoolean {
  type: "boolean";
  value: boolean;
}

let atom = function (token: string): Token {
  // if can parse as number, then parse as number
  // else if can parse as boolean, then parse as boolean
  // else parse as symbol
  if (!isNaN(parseFloat(token))) {
    return { type: "number", value: parseFloat(token) };
  } else if (token == "#t") {
    return { type: "boolean", value: true };
  } else if (token == "#f") {
    return { type: "boolean", value: false };
  } else {
    return { type: "symbol", value: token };
  }
};

const fold = (reducer: (acc: any, a: any) => any, init: any, xs: any) => {
  let acc = init;
  for (const x of xs) {
    acc = reducer(acc, x);
  }
  return acc;
};

let standard_env = function (): any {
  let env = {
    "+": (xs: any[]) => fold((acc, x) => acc + x, 0, xs),
    "-": (xs: any[]) => fold((acc, x) => acc - x, xs.shift(), xs),
    "*": (xs: any[]) => fold((acc, x) => acc * x, 1, xs),
    "/": (xs: any[]) => fold((acc, x) => acc * x, xs.shift(), xs),
    ">": (xs: any[]) => xs[0] > xs[1],
    "<": (xs: any[]) => xs[0] < xs[1],
    begin: (xs: []) => xs[xs.length - 1],
  };
  return env;
};

// clean this up
let evaluate = function (x: Token[] | Token, env = standard_env()): any {
  if (!Array.isArray(x) && x.type === "symbol") {
    return env[x.value];
  } else if (!Array.isArray(x) && x.type === "number") {
    return x.value;
  } else if (!Array.isArray(x) && x.type === "boolean") {
    return x.value;
  } else if (Array.isArray(x)) {
    if (x[0].value === "define") {
      let symbol = x[1].value;
      let value = evaluate(x[2], env);
      env[symbol] = value;
    } else if (x[0].value === "if") {
      let condition = evaluate(x[1], env);
      let true_branch = x[2];
      let false_branch = x[3];
      if (condition) {
        return evaluate(true_branch, env);
      } else {
        return evaluate(false_branch, env);
      }
    } else {
      let fn = evaluate(x[0], env);
      let args = x.slice(1).map((x) => evaluate(x, env));
      if (fn instanceof Function) {
        return fn(args);
      } else {
        console.log(env);
      }
    }
  } else {
    throw "unknown type";
  }
};

export let interpret = function (program: string) {
  let tokens = tokenize(program);
  let ast = read_from_tokens(tokens);
  return evaluate(ast);
};
