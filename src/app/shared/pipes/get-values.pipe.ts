import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'getValues'})
export class GetValuesPipe implements PipeTransform {
  transform(map: Map<any, any>): any[] {
    console.log("map is ", JSON.stringify(map))
    let ret = [];

    map.forEach((val, key) => {
      val.forEach((task) => {
        ret.push(task)
      })
      // ret.concat(val);
    });
    console.log('getvalues ', JSON.stringify(ret))
    return ret;
  }
}
