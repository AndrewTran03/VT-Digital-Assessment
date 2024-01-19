// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// REMOVE THESE LATER
type Test1 = {
  name: string;
  num: number;
};

type Test2 = Prettify<
  Test1 & {
    isTrue: boolean;
  }
>;

export { Test2 };
