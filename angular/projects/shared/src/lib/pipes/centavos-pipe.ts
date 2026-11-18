import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'centavos',
})
export class CentavosPipe implements PipeTransform {
  transform(centavos: number): number {
    return centavos / 100;
  }
}
