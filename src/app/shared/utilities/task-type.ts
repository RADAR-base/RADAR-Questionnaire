export enum TaskType {
  NON_CLINICAL,
  CLINICAL,
  ALL
}

export function getTaskType(task) {
  if (task.isClinical == false) return TaskType.NON_CLINICAL
  return TaskType.CLINICAL
}
