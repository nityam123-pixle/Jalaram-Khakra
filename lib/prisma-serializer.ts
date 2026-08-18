export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) return data

  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (typeof value === "bigint") {
        return Number(value)
      }
      // Prisma Decimal objects have a specific constructor structure or internal fields (d, e, s)
      if (typeof value === "object" && value !== null) {
        if (value.constructor?.name === "Decimal" || ("d" in value && "e" in value && "s" in value)) {
          return Number(value)
        }
      }
      return value
    })
  )
}

