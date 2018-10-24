export interface ReportScheduling {
  index: number
  timestamp: number
  viewed: boolean
  firstViewedOn: number
  range: ReportRange
}

export interface ReportRange {
  timestampStart: number
  timestampEnd: number
}
