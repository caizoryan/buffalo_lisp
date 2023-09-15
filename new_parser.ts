import { Token, TokenType } from "./tokeniser";

export type Atom =
  | AtomNumber
  | AtomSymbol
  | AtomBoolean
  | AtomString
  | AtomOfError;

interface AtomNumber {
  type: "number";
  value: number;
}

interface AtomSymbol {
  type: "symbol";
  value: string;
}

interface AtomString {
  type: "string";
  value: string;
}

interface AtomBoolean {
  type: "boolean";
  value: boolean;
}

interface AtomOfError {
  type: "error";
  value: string;
}

// Makes the AST
export let read_from_tokens_new = function(tokens: Token[]): Atom | Atom[] {
  // First check the length of the tokens
  if (tokens.length == 0) {
    throw "unexpected EOF while reading";
  }

  // Pop the first token
  let token = tokens.shift();

  if (token?.tokenType == TokenType.LeftBracket) {
    // If the token is a left parenthesis, then we start a new expression
    let list: any[] = [];
    while (tokens[0].tokenType != TokenType.RightBracket) {
      list.push(read_from_tokens_new(tokens));
    }
    tokens.shift(); // pop off ')'
    return list;
  } else if (token?.tokenType == TokenType.RightBracket) {
    // If the token is a right parenthesis, then we have an error
    return { type: "error", value: "unexpected )" };
  } else if (token && token.tokenType != TokenType.Eof) {
    // Otherwise, we have an atom
    return atom(token);
  } else {
    throw "unexpected token";
  }
};

let atom = function(token: Token): Atom {
  // if can parse as number, then parse as number
  // else if can parse as boolean, then parse as boolean
  // else parse as symbol
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
