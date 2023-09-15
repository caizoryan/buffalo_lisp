import { expect, test } from "bun:test";
import { Scanner, Token, TokenType } from "./tokeniser";
import { read_from_tokens_new } from "./new_parser";

test("tokenize boolean", () => {
  expect(new Scanner("(#t)").scan()[1].literal).toEqual(true);
});

test("tokenize string", () => {
  expect(new Scanner('("dog")').scan()[1].literal).toEqual("dog");
});

test("tokenize number", () => {
  expect(new Scanner("(2)").scan()[1].literal).toEqual(2);
});

test("tokenize symbol", () => {
  expect(new Scanner("(x)").scan()[1].tokenType).toEqual("Symbol");
});

test("tokenize symbol and string", () => {
  expect(new Scanner('(xass "whore")').scan()[1].lexeme).toEqual("xass");
  expect(new Scanner('(x "whore")').scan()[2].tokenType).toEqual("String");
});

test("tokenize +", () => {
  expect(new Scanner("(+ x)").scan()[1].tokenType).toEqual("Symbol");
});
