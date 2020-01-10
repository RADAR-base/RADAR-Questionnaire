import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import {ConsentPageItem} from "../../../shared/models/auth";
import {DefaultLanguage} from "../../../../assets/data/defaultConfig";
import {LanguageSetting} from "../../../shared/models/settings";
import {LocalizationService} from "../../../core/services/misc/localization.service";
import {AlertService} from "../../../core/services/misc/alert.service";
import {UsageService} from "../../../core/services/usage/usage.service";
import {LogService} from "../../../core/services/misc/log.service";
import {StorageService} from "../../../core/services/storage/storage.service";
import {SettingsPageComponent} from "../../settings/containers/settings-page.component";
import {HomePageComponent} from "../../home/containers/home-page.component";

@Component({
  selector: 'page-learning',
  templateUrl: 'learning-page.component.html'
})
export class LearningPageComponent {

  loading: boolean = false
  showOutcomeStatus: boolean = false
  outcomeStatus: string

  learningPageItems: ConsentPageItem[]
  language?: LanguageSetting = DefaultLanguage

  constructor(
    public navCtrl: NavController,
    private localization: LocalizationService,
    private alertService: AlertService,
    private usage: UsageService,
    private logger: LogService,
    private storage: StorageService,
  ) {
    this.localization.update().then(lang => (this.language = lang))
    this.learningPageItems = [
      {
        title: "Time Commitment",
        iconMd: "md-alarm",
        detail: [
          "We know your time is valuable. That’s why the HOME app has two types of surveys - one short and one longer. Each time we want you to complete one of these surveys you will be sent a notification to open the HOME app.",
          "In the short survey, sent either once a week or every three days, you will be asked about your health in the last week. If you have been feeling well, this will take less than 15 seconds to complete. If you have not been well, it will take about 1 min to complete.",
          "In the longer surveys, sent either once a week or every two weeks, you will be asked about a wider range of health and non-health related questions. These surveys are designed to take less than 5 minutes to complete."
        ]
      },
      {
        title: "Privacy",
        iconMd: "md-lock",
        detail: [
          "We take our obligation to protect your privacy very seriously. All of your information will be kept strictly confidential throughout the research project. It will not be possible to identify you from any of the publications or reports that are based on this study. Any answers you give to the survey questions will go from the app, to a secure server hosted by Amazon, and then straight to UCL."
        ]
      },
      {
        title: "Data Collection",
        iconMd: "md-analytics",
        detail: [
          "The survey questions will cover a wide range of topics that can affect your health and wellbeing, like your nutrition, housing, employment, and experience with your GP or healthcare provider. You may find that some questions do not apply to you or make you feel uncomfortable. You are free to choose ‘no response’ or stop answering the survey at any time by choosing the ‘stop survey’ option. Your data will only be used for academic research by UCL and will not be shared with anyone."
        ]
      },
      {
        title: "Benefits",
        iconMd: "md-chatbubbles",
        detail: [
          "Taking part in this study will help us gain a better understanding of the health of migrants like you in the UK. While there are no immediate benefits for you, every survey that you fill out will increase our understanding of the health and wellbeing of migrants."
        ]
      },
      {
        title: "Study Findings",
        iconMd: "md-school",
        detail: [
          "The results of this study will be written up and published in scientific journals as well as within wider media platforms. We will engage with policymakers to help them make decisions that  better reflect the health needs of migrants like yourself in the UK. Additionally, we will send you summaries of our analysed data every few months via email. The results will also be on the study website (www.homeappstudy.net)."
        ]
      },
      {
        title: "Disadvantages",
        iconMd: "md-warning",
        detail: [
          "In this study you will be asked questions relating to migration, mental and sexual health which you may find distressing. There is a possibility that completing the surveys could evoke previous negative experiences with your health or migratory experience.",
          "Before you undertake a survey you will be explained in short about its content and you can then decide not to take part in that particular survey. Following most surveys, we will include information to signpost you to national support related to the survey you have just undertaken and should you become distressed. Additionally, the resource section of the HOME app will have more information about the health and migration services available in the UK.",
          "We advise you to contact your GP or local mental health services should you feel you need more support. Additionally, the resource section of the HOME app will have more information about the health and migration services available in the UK."
        ]
      },
      {
        title: "Data Protection",
        iconMd: "md-paper",
        detail: [
          "The controller for this project will be University College London (UCL). The UCL Data Protection Officer provides oversight of UCL activities involving the processing of personal data, and can be contacted at data-protection@ucl.ac.uk. This ‘local’ privacy notice sets out the information that applies to this particular study. Further information on how UCL uses participant information can be found in our ‘general’ privacy notice: For participants in health and care research studies, click here (www.homeappstudy.net).",
          "The information that is required to be provided to participants under data protection legislation (GDPR and DPA 2018) is provided across both the ‘local’ and ‘general’ privacy notices. The lawful basis that will be used to process your personal data are: ‘Public task’ for personal data and’ Research purposes’ for special category data.",
          "Your personal data will be processed so long as it is required for the research project. If we are able to anonymise or pseudonymise the personal data you provide we will undertake this, and will endeavour to minimise the processing of personal data wherever possible. If you are concerned about how your personal data is being processed, or if you would like to contact us about your rights, please contact UCL in the first instance at data-protection@ucl.ac.uk."
        ]
      },
      {
        title: "Follow Up",
        iconMd: "md-mail",
        detail: [
          "Your email address will be included in this research study's registry. We will send a newsletter every few months with information about this study. You can opt out of this registry at any time to stop receiving the newsletter or any other form of correspondence."
        ]
      },
      {
        title: "Withdrawing",
        iconMd: "md-log-out",
        detail: [
          "Your participation in this study is entirely voluntary. You may withdraw your consent and stop your participation in this study at any time. If you choose to withdraw, we will stop collecting any new data and can destroy all of the data we have previously collected. To withdraw from the study, simply send an email to the research team at r.aldridge@ucl.ac.uk."
        ]
      }

    ]
  }

  ionViewDidLoad() {
    this.usage.setPage(this.constructor.name)
  }

  clearStatus() {
    this.showOutcomeStatus = false
  }

  showStatus() {
    setTimeout(() => (this.showOutcomeStatus = true), 500)
  }

  navigateToHome() {
    this.navCtrl.setRoot(HomePageComponent)
  }

  navigateToSettings() {
    this.navCtrl.setRoot(SettingsPageComponent)
  }

}
