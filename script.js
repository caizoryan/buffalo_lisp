// index.ts
var tokenize = function(input) {
  return input.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
};
var read_from_tokens = function(tokens) {
  if (tokens.length == 0) {
    throw "unexpected EOF while reading";
  }
  let token = tokens.shift();
  if (token == "(") {
    let list = [];
    while (tokens[0] != ")") {
      list.push(read_from_tokens(tokens));
    }
    tokens.shift();
    return list;
  } else if (token == ")") {
    throw "unexpected )";
  } else if (token) {
    return atom(token);
  } else {
    throw "unexpected token";
  }
};
var atom = function(token) {
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
var fold = (reducer, init, args) => {
  let acc = init;
  for (const x of args) {
    acc = reducer(acc, x);
  }
  return acc;
};
var standard_env = function() {
  let env = {
    "+": (args) => fold((acc, x) => acc + x, 0, args),
    "-": (args) => fold((acc, x) => acc - x, args.shift(), args),
    "*": (args) => fold((acc, x) => acc * x, 1, args),
    "/": (args) => fold((acc, x) => acc * x, args.shift(), args),
    ">": (args) => args[0] > args[1],
    "<": (args) => args[0] < args[1],
    car: (args) => args[0][0],
    apply: (args) => args[0](args.slice(1)),
    list: (args) => args,
    cdr: (args) => args[0].slice(1),
    cons: (args) => [args[0]].concat(args[1]),
    len: (args) => args.length,
    begin: (args) => args[args.length - 1]
  };
  return new Env(env);
};

class Env {
  outer;
  data;
  constructor(data, outer) {
    this.outer = outer;
    this.data = data;
  }
  find(key) {
    if (key in this.data) {
      return this.data[key];
    } else if (this.outer) {
      return this.outer.find(key);
    } else {
      throw "unbound variable not found" + key;
    }
  }
  inner_set(key, value) {
    this.data[key] = value;
  }
  find_and_set(key, value) {
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
  params;
  body;
  env;
  constructor(params, body, env) {
    this.params = params;
    this.body = body;
    this.env = env;
  }
  call(args) {
    this.params.forEach((param, i) => {
      this.env.inner_set(param, args[i]);
    });
    return evaluate(this.body, this.env);
  }
}
var evaluate = function(x, env = standard_env()) {
  if (!Array.isArray(x) && x.type === "symbol") {
    return env.find(x.value);
  } else if (!Array.isArray(x) && x.type === "number") {
    return x.value;
  } else if (!Array.isArray(x) && x.type === "boolean") {
    return x.value;
  } else if (Array.isArray(x)) {
    if (x[0].value === "define") {
      let symbol = x[1].value;
      let value = evaluate(x[2], env);
      env.inner_set(symbol, value);
      return;
    }
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
    if (x[0].value === "quote") {
      return x[1].map((x2) => x2.value);
    }
    if (x[0].value === "set!") {
      let symbol = x[1].value;
      let value = evaluate(x[2], env);
      env.find_and_set(symbol, value);
      return;
    }
    if (x[0].value === "lambda") {
      let params = x[1].map((x2) => x2.value);
      let body = x[2];
      return new Procedure(params, body, env);
    } else {
      let fn = evaluate(x[0], env);
      let args = x.slice(1).map((x2) => evaluate(x2, env));
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
var interpret = function(program) {
  let tokens = tokenize(program);
  let ast = read_from_tokens(tokens);
  return evaluate(ast);
};
export {
  tokenize,
  read_from_tokens,
  interpret
};
