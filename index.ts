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
export let tokenize = function(input: string) {
  return input.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
};

// Makes the AST
export let read_from_tokens = function(tokens: string[]): Token | Token[] {
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

let atom = function(token: string): Token {
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

const fold = (reducer: (acc: any, a: any) => any, init: any, args: any) => {
  let acc = init;
  for (const x of args) {
    acc = reducer(acc, x);
  }
  return acc;
};

let standard_env = function(): Env {
  let env = {
    "+": (args: any[]) => fold((acc, x) => acc + x, 0, args),
    "-": (args: any[]) => fold((acc, x) => acc - x, args.shift(), args),
    "*": (args: any[]) => fold((acc, x) => acc * x, 1, args),
    "/": (args: any[]) => fold((acc, x) => acc * x, args.shift(), args),
    ">": (args: any[]) => args[0] > args[1],
    "<": (args: any[]) => args[0] < args[1],
    "=": (args: any[]) => args[0] == args[1],
    "null?": (args: any[]) => args[0].length == 0,
    car: (args: any[]) => args[0][0],
    apply: (args: any[]) => args[0](args.slice(1)),
    list: (args: any[]) => args,
    cdr: (args: any[]) => args[0].slice(1),
    cons: (args: any[]) => [args[0]].concat(args[1]),
    len: (args: any[]) => {
      console.log(args.length);
      args.length;
    },
    begin: (args: any[]) => args[args.length - 1],
  };
  return new Env(env);
};

class Env {
  outer: any;
  data: any;
  constructor(data: any, outer?: any) {
    this.outer = outer;
    this.data = data;
  }
  find(key: any) {
    if (key in this.data) {
      return this.data[key];
    } else if (this.outer) {
      return this.outer.find(key);
    } else {
      throw "unbound variable not found" + key;
    }
  }

  inner_set(key: any, value: any) {
    this.data[key] = value;
  }

  find_and_set(key: any, value: any) {
    if (key in this.data) {
      this.data[key] = value;
    } else if (this.outer) {
      this.outer.find_and_set(key, value);
    } else {
      throw "didnt find variable to set" + key;
    }
  }
}

class Procedure {
  params: any;
  body: any;
  env: any;
  constructor(params: any, body: any, env: any) {
    this.params = params;
    this.body = body;
    this.env = env;
  }
  call(args: any) {
    this.params.forEach((param: any, i: any) => {
      this.env.inner_set(param, args[i]);
    });
    return evaluate(this.body, this.env);
  }
}

// clean this up
let evaluate = function(x: Token[] | Token, env = standard_env()): any {
  if (!Array.isArray(x) && x.type === "symbol") {
    return env.find(x.value);
  } else if (!Array.isArray(x) && x.type === "number") {
    return x.value;
  } else if (!Array.isArray(x) && x.type === "boolean") {
    return x.value;
  } else if (Array.isArray(x)) {
    if (x === undefined || x.length === 0) {
      return;
    }

    // Define
    // -------
    if (x[0].value === "define") {
      let symbol = x[1].value;
      let value = evaluate(x[2], env);
      env.inner_set(symbol, value);
      return;
    }

    // If
    // -------
    if (x[0].value === "if") {
      let condition = evaluate(x[1], env);
      let true_branch = x[2];
      let false_branch = x[3];
      if (condition) {
        return evaluate(true_branch, env);
      } else {
        return evaluate(false_branch, env);
      }
    }

    // Quote
    // -------
    if (x[0].value === "quote") {
      if (Array.isArray(x[1])) {
        return x[1].map((x) => x.value);
      } else {
        return x[1].value;
      }
      // @ts-ignore
    }

    // Set!
    if (x[0].value === "set!") {
      let symbol = x[1].value;
      let value = evaluate(x[2], env);
      env.find_and_set(symbol, value);
      return;
    }

    // Lambda
    // -------
    if (x[0].value === "lambda") {
      //@ts-ignore
      let params = x[1].map((x) => x.value);
      let body = x[2];
      return new Procedure(params, body, env);
    }

    // Symbol
    // -------
    else {
      let fn = evaluate(x[0], env);
      let args = x.slice(1).map((x) => evaluate(x, env));
      if (fn instanceof Function) {
        return fn(args);
      } else if (fn instanceof Procedure) {
        return fn.call(args);
      } else {
      }
    }
  } else {
    throw "unknown type";
  }
};

export let interpret = function(program: string) {
  let tokens = tokenize(program);
  let ast = read_from_tokens(tokens);
  return evaluate(ast);
};
