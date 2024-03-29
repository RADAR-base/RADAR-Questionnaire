import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { Ionic4DatepickerModule } from '@logisticinfotech/ionic4-datepicker'

import { PipesModule } from '../../../../shared/pipes/pipes.module'
import { WheelSelectorComponent } from '../wheel-selector/wheel-selector.component'
import { AudioInputComponent } from './audio-input/audio-input.component'
import { CheckboxInputComponent } from './checkbox-input/checkbox-input.component'
import { DescriptiveInputComponent } from './descriptive-input/descriptive-input.component'
import { HealthInputComponent } from './health-input/health-input.component'
import { InfoScreenComponent } from './info-screen/info-screen.component'
import { MatrixRadioInputComponent } from './matrix-radio-input/matrix-radio-input.component'
import { NotesInputComponent } from './notes-input/notes-input.component'
import { QuestionComponent } from './question.component'
import { RadioInputComponent } from './radio-input/radio-input.component'
import { RangeInfoInputComponent } from './range-info-input/range-info-input.component'
import { RangeInputComponent } from './range-input/range-input.component'
import { SliderInputComponent } from './slider-input/slider-input.component'
import { TextInputComponent } from './text-input/text-input.component'
import { TimedTestComponent } from './timed-test/timed-test.component'
import { WebInputComponent } from './web-input/web-input.component'

const COMPONENTS = [
  QuestionComponent,
  AudioInputComponent,
  CheckboxInputComponent,
  RadioInputComponent,
  RangeInputComponent,
  SliderInputComponent,
  TimedTestComponent,
  InfoScreenComponent,
  RangeInfoInputComponent,
  TextInputComponent,
  WheelSelectorComponent,
  DescriptiveInputComponent,
  MatrixRadioInputComponent,
  HealthInputComponent,
  WebInputComponent,
  NotesInputComponent
]

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    Ionic4DatepickerModule,
    IonicModule.forRoot()
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class QuestionModule {}
