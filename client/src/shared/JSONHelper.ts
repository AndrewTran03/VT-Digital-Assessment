/* eslint-disable @typescript-eslint/no-explicit-any */
// To help JSON.stringify() and JSON.parse() handle the complex Map class:
// Reference: https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map

function mapReplacer(_key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()) // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

function mapReviver(_key: any, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    }
  }
  return value;
}

export { mapReplacer, mapReviver };
