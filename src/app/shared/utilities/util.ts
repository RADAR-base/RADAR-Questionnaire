import { Injectable } from '@angular/core'

@Injectable()
export class Utility {
  constructor() { }

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

  deepCopy(o) {
    let newO,
      i;

    if (typeof o !== 'object') {
      return o;
    }
    if (!o) {
      return o;
    }

    if ('[object Array]' === Object.prototype.toString.apply(o)) {
      newO = [];
      for (i = 0; i < o.length; i += 1) {
        newO[i] = this.deepCopy(o[i]);
      }
      return newO;
    }

    newO = {};
    for (i in o) {
      if (o.hasOwnProperty(i)) {
        newO[i] = this.deepCopy(o[i]);
      }
    }
    return newO;
  }

  mapToObject(map: Map<string, string>): Object {
    if (!map) return
    return Array.from(map).reduce(
      (obj, [key, value]) => Object.assign(obj, { [key]: value }),
      {}
    )
  }

  base64ToUnicode(raw: string): string {
    return decodeURIComponent(escape(atob(raw)))
  }

  chunk(arr: any[], size: number): any[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_: any, i: number) =>
      arr.slice(i * size, i * size + size)
    )
  }

  chunkObject(obj: Object, size: number, key: string): any[] {
    return this.chunk(obj[key], size).map((entries: any[]) =>
      Object.assign({}, obj, { [key]: entries })
    )
  }
}
