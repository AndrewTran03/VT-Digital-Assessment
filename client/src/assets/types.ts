// Shared Typescript Types/Interfaces/Other Global-Variables Used Throughout the Project:

// Reference: https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const backendUrlBase = "http://localhost:3000";

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

type APIErrorResponse = {
  errorLoc: string;
  errorMsg: string;
};

type CourseObjective = {
  deptAbbrev: string;
  courseNum: number;
  semester: "Fall" | "Spring" | "Summer" | "Winter";
  year: number;
  canvasObjective: string;
};

export { Test2, backendUrlBase, APIErrorResponse, CourseObjective };
