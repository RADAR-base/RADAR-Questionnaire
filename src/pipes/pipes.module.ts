import { NgModule } from '@angular/core'

import { TranslatePipe } from './../pipes/translate/translate'

@NgModule({
  declarations: [TranslatePipe],
  imports: [],
  exports: [TranslatePipe]
})
export class PipesModule {}
