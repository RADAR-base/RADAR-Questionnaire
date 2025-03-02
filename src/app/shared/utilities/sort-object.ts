export function sortObject(object, order) {
  // Object is in the form {key: value}
  // This function sorts the object keys by the order object: {key: orderValue}
  // If the key is not present, this will be ordered alphabetically, if string, ascending if number
  return Object.keys(object)
    .sort((a, b) => {
      const diff = order[a] - order[b]
      if (diff == 0 || isNaN(diff)) return a < b ? -1 : a > b ? 1 : 0
      else return diff < 0 ? -1 : 1
    })
    .reduce((acc, key) => {
      acc[key] = object[key]
      return acc
    }, {})
}
