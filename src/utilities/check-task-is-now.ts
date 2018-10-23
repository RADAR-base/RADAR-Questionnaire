export function checkTaskIsNow(taskDate) {
  return taskDate > Date.now() ? false : true
}
