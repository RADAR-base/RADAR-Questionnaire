import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { IonicModule, NavController } from '@ionic/angular'
import { PipesModule } from 'src/app/shared/pipes/pipes.module'

import { AppModule } from '../../../app.module'
import { TaskCalendarModule } from '../components/task-calendar/task-calendar.module'
import { TaskInfoModule } from '../components/task-info/task-info.module'
import { TaskProgressModule } from '../components/task-progress/task-progress.module'
import { TickerBarModule } from '../components/ticker-bar/ticker-bar.module'
import { HomePageComponent } from './home-page.component'

describe('HomePageComponent', () => {
  let component: any
  let fixture: ComponentFixture<any>

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        IonicModule,
        TaskProgressModule,
        TickerBarModule,
        TaskInfoModule,
        TaskCalendarModule,
        PipesModule
      ],
      declarations: [HomePageComponent],
      providers: [NavController]
    }).compileComponents()

    fixture = TestBed.createComponent(HomePageComponent)
    component = fixture.debugElement.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component instanceof HomePageComponent).toBe(true)
  })
})
