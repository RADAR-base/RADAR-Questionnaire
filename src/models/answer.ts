export interface Answer {
  id: string
  value: any
  type: string
}


// interface to submit answers to Kafka

export interface Response {
  value: any,
  startTime: number,
  endTime: number
}

export interface AnswerValueExport {
  name: any,
  version: any,
  answers: Response[],
  time: number,
  timeCompleted: number
}

export interface AnswerKeyExport {
  userId: string,
  sourceId: string
}

// interface to submit answers to Kafka
