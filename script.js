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
var fold = (reducer, init, xs) => {
  let acc = init;
  for (const x of xs) {
    acc = reducer(acc, x);
  }
  return acc;
};
var standard_env = function() {
  let env = {
    "+": (xs) => fold((acc, x) => acc + x, 0, xs),
    "-": (xs) => fold((acc, x) => acc - x, xs.shift(), xs),
    "*": (xs) => fold((acc, x) => acc * x, 1, xs),
    "/": (xs) => fold((acc, x) => acc * x, xs.shift(), xs),
    ">": (xs) => xs[0] > xs[1],
    "<": (xs) => xs[0] < xs[1],
    begin: (xs) => xs[xs.length - 1]
  };
  return env;
};
var evaluate = function(x, env = standard_env()) {
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
      let args = x.slice(1).map((x2) => evaluate(x2, env));
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
