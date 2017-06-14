export interface Answer {
  id: string
  value: any
}


// interface to submit answers to Kafka

export interface Response {
  value: any,
  startTime: number,
  endTime: number
}

export interface AnswerExport {
  "type": any,
  "version": number,
  "answers": Response[],
  "startTime": number,
  "endTime": number
}

// interface to submit answers to Kafka
