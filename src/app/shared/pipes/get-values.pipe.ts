import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'getValues'})
export class GetValuesPipe implements PipeTransform {
  transform(map: Map<any, any>): any[] {
    const ret = [];

    map.forEach((val, key) => {
      val.forEach((task) => {
        ret.push(task)
      })
    });
    return ret;
  }
}
