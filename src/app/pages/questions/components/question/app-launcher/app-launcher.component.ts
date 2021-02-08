import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core'
import { NavController, Platform } from 'ionic-angular'
import { AppLauncher, AppLauncherOptions } from '@ionic-native/app-launcher/ngx';

@Component({
  selector: 'app-launcher',
  templateUrl: 'app-launcher.component.html'
})
export class AppLauncherComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()

  @Input()
  appName?: string

  @Input()
  androidPackageName?: string

  @Input()
  iosPackageName?: string

  @Input()
  timestamp: Number

  buttonEnabled = false

  constructor(
    private appLauncher: AppLauncher,
    private platform: Platform
  ) {
  }

  ngOnInit() {
    this.buttonEnabled = this.platform.is('android') && !!this.androidPackageName ||
      this.platform.is('ios') && !!this.iosPackageName
    if(!this.buttonEnabled){
      this.valueChange.emit(false)
    }
  }

  handleLaunch() {
    const options: AppLauncherOptions = {}

    if(this.platform.is('ios')) {
      options.uri = this.iosPackageName
    } else {
      // eu.dynamore.app://dynamore/questionnaire_completed?timestamp= 1612452411000
      options.packageName = this.androidPackageName + '://dynamore/questionnaire_completed?timestamp=' + this.timestamp
    }

    this.appLauncher.canLaunch(options)
      .then((canLaunch: boolean) => {
        if(canLaunch){
          this.appLauncher.launch(options).then(()=>{
            this.valueChange.emit(true)
          }, (err)=>{
            this.valueChange.emit(false)
          })
        } else {
          this.valueChange.emit(false)
        }
      })
      .catch((error: any) => this.valueChange.emit(false));
  }
}
