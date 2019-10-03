import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'getValues'})
export class GetValuesPipe implements PipeTransform {
  transform(map: Map<any, any>): any[] {
    console.log("map is ", map)
    let ret = [];

    map.forEach((val, key) => {
      ret.push(val);
    });

    return ret;
  }
}
