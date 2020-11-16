export const parseBoolean = (value: unknown): boolean | undefined =>
  typeof value === "string" ? value.toLowerCase() === "true" : undefined;

export const parseInteger = (value: unknown): number | undefined => {
  if (!(typeof value === "string")) {
    return undefined;
  }
  const number = parseInt(value);
  return Number.isInteger(number) ? number : undefined;
};
