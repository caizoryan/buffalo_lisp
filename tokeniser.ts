export const TokenType = {
  LeftBracket: "LeftBracket",
  RightBracket: "RightBracket",
  Symbol: "Symbol",
  Number: "Number",
  Boolean: "Boolean",
  String: "String",
  Eof: "Eof",
};

export class Token {
  tokenType: any;
  lexeme: any;
  literal: any;

  constructor(tokenType: any, lexeme: any, literal: any) {
    this.tokenType = tokenType;
    this.lexeme = lexeme;
    this.literal = literal;
  }
}

export class Scanner {
  start = 0;
  current = 0;
  tokens: any[] = [];
  source: any;

  constructor(source: any) {
    this.source = source;
  }

  scan() {
    while (!this.isAtEnd()) {
      // save the index at the start of each new token
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
            const literal = parseFloat(numberAsString);
            this.addToken(TokenType.Number, literal);
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
  isDigit(char: string) {
    return char >= "0" && char <= "9";
  }

  isDigitOrDot(char: string) {
    return this.isDigit(char) || char === ".";
  }
  isIdentifier(char: string) {
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

  addToken(tokenType: any, literal?: any) {
    const lexeme = this.source.slice(this.start, this.current);
    this.tokens.push(new Token(tokenType, lexeme, literal));
  }
}
