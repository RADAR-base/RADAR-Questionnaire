export interface Answer {
  id: string
  value: any
  type: string
}

// NOTE: Interface to submit answers to Kafka

export interface Response {
  questionId: string
  value: any
  startTime: number
  endTime: number
}

export interface AnswerValueExport {
  name: any
  version: any
  answers: Response[]
  time: number
  timeCompleted: number
  timeNotification: Object
}

export interface AnswerKeyExport {
  userId: string
  sourceId: string
  projectId: string
}
<<<<<<< HEAD
=======

export interface CompletionLogValueExport {
  name: string
  time: number
  timeNotification: Object
  completionPercentage: any
}

export interface ApplicationTimeZoneValueExport {
  time: number
  offset: number
}
>>>>>>> 4be12a16bb361d443432910e3d129ceeb4d7567b
