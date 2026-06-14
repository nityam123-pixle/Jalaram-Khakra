export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) return data

  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      // Prisma Decimal objects have a specific constructor structure
      if (typeof value === "object" && value !== null) {
        if (value.constructor?.name === "Decimal" || "d" in value && "e" in value && "s" in value) {
          return Number(value)
        }
      }
      return value
    })
  )
}
