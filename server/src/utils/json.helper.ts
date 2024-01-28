// To help JSON.stringify() and JSON.parse() handle the complex Map class:
// Reference: https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReplacer(key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()) // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReviver(key: any, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    }
  }
  return value;
}

export { mapReplacer, mapReviver };
