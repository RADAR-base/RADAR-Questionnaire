import { Injectable } from '@angular/core'

@Injectable()
export class Utility {
  constructor() {}

  /**
   * Partition the given array into two parts.
   * @param array
   * @param partitionBy partitioning function, if it returns false it goes to partition negative,
   * otherwise a value goes into partition positive
   */
  partition<T>(
    array: T[],
    partitionBy: (T) => boolean
  ): { negative: T[]; positive: T[] } {
    return array.reduce(
      (part, value) => {
        if (partitionBy(value)) {
          part.positive.push(value)
        } else {
          part.negative.push(value)
        }
        return part
      },
      { negative: [], positive: [] }
    )
  }
}
