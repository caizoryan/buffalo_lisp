import { expect, test } from "bun:test";
import { interpret, read_from_tokens, tokenize } from "./index";

test("tokenize", () => {
  expect(tokenize("(begin (define r 10) (* pi (* r r)))")).toEqual([
    "(",
    "begin",
    "(",
    "define",
    "r",
    "10",
    ")",
    "(",
    "*",
    "pi",
    "(",
    "*",
    "r",
    "r",
    ")",
    ")",
    ")",
  ]);
});

test("parse single", () => {
  expect(read_from_tokens(tokenize("(x)"))).toEqual([
    { type: "symbol", value: "x" },
  ]);
});

test("parse addition", () => {
  expect(read_from_tokens(tokenize("(+ x 1)"))).toEqual([
    { type: "symbol", value: "+" },
    { type: "symbol", value: "x" },
    { type: "number", value: 1 },
  ]);
});

test("parse nested addition )", () => {
  expect(read_from_tokens(tokenize("(+ x (+ 2 5))"))).toEqual([
    { type: "symbol", value: "+" },
    { type: "symbol", value: "x" },
    [
      { type: "symbol", value: "+" },
      { type: "number", value: 2 },
      { type: "number", value: 5 },
    ],
  ]);
});

test("parse boolean true)", () => {
  expect(read_from_tokens(tokenize("(set x #t)"))).toEqual([
    { type: "symbol", value: "set" },
    { type: "symbol", value: "x" },
    { type: "boolean", value: true },
  ]);
});

test("parse boolean false)", () => {
  expect(read_from_tokens(tokenize("(set x #f)"))).toEqual([
    { type: "symbol", value: "set" },
    { type: "symbol", value: "x" },
    { type: "boolean", value: false },
  ]);
});

test("addition", () => {
  expect(interpret("(+ 2 2)")).toEqual(4);
});

test("addition with more than 2", () => {
  expect(interpret("(+ 2 2 3 5)")).toEqual(12);
});

test("subtraction", () => {
  expect(interpret("(- 6 2)")).toEqual(4);
});

test("subtraction with more than 2", () => {
  expect(interpret("(- 8 2 3 2)")).toEqual(1);
});

test("multiplication", () => {
  expect(interpret("(* 8 2)")).toEqual(16);
});

test("multiplication with more than 2", () => {
  expect(interpret("(* 8 2 2)")).toEqual(32);
});

test("define", () => {
  expect(interpret("(begin (define x 4) x)")).toEqual(4);
});

test("complex defines", () => {
  expect(interpret("(begin ((define x 4) (define y 5)) (+ x y))")).toEqual(9);
});

test("if true", () => {
  expect(interpret("(if #t 1 2)")).toEqual(1);
});

test("if false", () => {
  expect(interpret("(if #f 1 2)")).toEqual(2);
});

test("complex if", () => {
  expect(interpret("(if (< 1 2) 1 2)")).toEqual(1);
});

test("list", () => {
  expect(interpret("(list 1 2 3)")).toEqual([1, 2, 3]);
});

test("cdr", () => {
  expect(interpret("(cdr (list 1 2 3))")).toEqual([2, 3]);
});

test("random bunch of math stuff", () => {
  expect(interpret(" (if (> (* 11 11) 120) (* 7 6) oops) ")).toEqual(42);
});

test("quote", () => {
  expect(interpret("(quote (1 2 3))")).toEqual([1, 2, 3]);
});

test("lambda", () => {
  expect(interpret("((lambda (x y) (+ x y 1)) 5 6)")).toEqual(12);
});
