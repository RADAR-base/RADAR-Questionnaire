export function compareTasks(a, b) {
  const diff = a.timestamp - b.timestamp
  if (diff != 0) {
    return diff
  }
  const aName = a.name.toUpperCase()
  const bName = b.name.toUpperCase()
  if (aName < bName) {
    return -1
  } else if (aName > bName) {
    return 1
  } else {
    return 0
  }
}
