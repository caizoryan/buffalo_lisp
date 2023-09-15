// tokeniser.ts
var TokenType = {
  LeftBracket: "LeftBracket",
  RightBracket: "RightBracket",
  Symbol: "Symbol",
  Number: "Number",
  Boolean: "Boolean",
  String: "String",
  Eof: "Eof"
};

class Token {
  tokenType;
  lexeme;
  literal;
  constructor(tokenType, lexeme, literal) {
    this.tokenType = tokenType;
    this.lexeme = lexeme;
    this.literal = literal;
  }
}

class Scanner {
  start = 0;
  current = 0;
  tokens = [];
  source;
  constructor(source) {
    this.source = source;
  }
  scan() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      const char = this.advance();
      switch (char) {
        case "(":
          this.addToken(TokenType.LeftBracket);
          break;
        case ")":
          this.addToken(TokenType.RightBracket);
          break;
        case " ":
        case "\r":
        case "\t":
        case "\n":
          break;
        case "#":
          if (this.peek() === "t") {
            this.advance();
            this.addToken(TokenType.Boolean, true);
            break;
          }
          if (this.peek() === "f") {
            this.advance();
            this.addToken(TokenType.Boolean, false);
            break;
          }
        case '"':
          while (this.peek() !== '"' && !this.isAtEnd()) {
            this.advance();
          }
          const literal = this.source.slice(this.start + 1, this.current);
          this.addToken(TokenType.String, literal);
          this.advance();
          break;
        default:
          if (this.isDigit(char)) {
            while (this.isDigitOrDot(this.peek()) && !this.isAtEnd()) {
              this.advance();
            }
            const numberAsString = this.source.slice(this.start, this.current);
            const literal2 = parseFloat(numberAsString);
            this.addToken(TokenType.Number, literal2);
            break;
          } else {
            if (this.isIdentifier(char)) {
              while (this.isIdentifier(this.peek()) && !this.isAtEnd()) {
                this.advance();
              }
              this.addToken(TokenType.Symbol);
              break;
            }
          }
      }
    }
    this.tokens.push(new Token(TokenType.Eof, "", null));
    return this.tokens;
  }
  isDigit(char) {
    return char >= "0" && char <= "9";
  }
  isDigitOrDot(char) {
    return this.isDigit(char) || char === ".";
  }
  isIdentifier(char) {
    return !["(", ")", " ", "\n", "\r"].includes(char);
  }
  isAtEnd() {
    return this.current >= this.source.length;
  }
  advance() {
    return this.source[this.current++];
  }
  peek() {
    return this.source[this.current];
  }
  addToken(tokenType, literal) {
    const lexeme = this.source.slice(this.start, this.current);
    this.tokens.push(new Token(tokenType, lexeme, literal));
  }
}

// new_parser.ts
var read_from_tokens_new = function(tokens) {
  if (tokens.length == 0) {
    throw "unexpected EOF while reading";
  }
  let token = tokens.shift();
  if (token?.tokenType == TokenType.LeftBracket) {
    let list = [];
    while (tokens[0].tokenType != TokenType.RightBracket) {
      list.push(read_from_tokens_new(tokens));
    }
    tokens.shift();
    return list;
  } else if (token?.tokenType == TokenType.RightBracket) {
    return { type: "error", value: "unexpected )" };
  } else if (token && token.tokenType != TokenType.Eof) {
    return atom(token);
  } else {
    throw "unexpected token";
  }
};
var atom = function(token) {
  if (token.tokenType == TokenType.Number) {
    return { type: "number", value: token.literal };
  } else if (token.tokenType == TokenType.Boolean) {
    return { type: "boolean", value: token.literal };
  } else if (token.tokenType == TokenType.String) {
    return { type: "string", value: token.literal };
  } else if (token.tokenType == TokenType.Symbol) {
    return { type: "symbol", value: token.lexeme };
  } else {
    throw "unexpected token";
  }
};

// index.ts
var tokenize = function(input) {
  return input.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
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
    "=": (args) => args[0] == args[1],
    "null?": (args) => args[0].length == 0,
    "string-append": (args) => args.join(""),
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
  } else if (!Array.isArray(x) && x.type === "string") {
    return x.value;
  } else if (Array.isArray(x)) {
    if (x === undefined || x.length === 0) {
      return;
    }
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
      if (Array.isArray(x[1])) {
        return x[1].map((x2) => x2.value);
      } else {
        return x[1].value;
      }
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
  console.log("program");
  let tokens = new Scanner(program).scan();
  console.log(tokens);
  let ast = read_from_tokens_new(tokens);
  console.log(ast);
  return evaluate(ast);
};
export {
  tokenize,
  interpret
};
