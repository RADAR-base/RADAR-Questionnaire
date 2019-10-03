import { NgModule } from '@angular/core'

import { TranslatePipe } from './translate/translate'
import {GetValuesPipe} from "./get-values.pipe";

@NgModule({
  declarations: [TranslatePipe, GetValuesPipe],
  exports: [TranslatePipe, GetValuesPipe]
})
export class PipesModule {}
