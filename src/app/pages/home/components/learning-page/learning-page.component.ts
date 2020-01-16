import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import {ConsentPageItem} from "../../../../shared/models/auth";
import {LanguageSetting} from "../../../../shared/models/settings";
import {DefaultLanguage} from "../../../../../assets/data/defaultConfig";
import {UsageService} from "../../../../core/services/usage/usage.service";
import {AlertService} from "../../../../core/services/misc/alert.service";
import {LocalizationService} from "../../../../core/services/misc/localization.service";
import {LogService} from "../../../../core/services/misc/log.service";
import {StorageService} from "../../../../core/services/storage/storage.service";
import {HomePageComponent} from "../../containers/home-page.component";
import {SettingsPageComponent} from "../../../settings/containers/settings-page.component";


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
    this.logger.log("Creating learning page")
    this.localization.update().then(lang => (this.language = lang))
    this.learningPageItems = [
      {
        title: "Visas and immigration",
        iconMd: "md-globe",
        detail: [
          `<div class="detail text-justify"> There is one single government website for all your visa and immigration information.</div>`,
          `<a href="https://www.gov.uk/browse/visas-immigration">https://www.gov.uk/browse/visas-immigration</a>`
        ]
      },
      {
        title: "Registering for work",
        iconMd: "md-create",
        detail: [
          `<div class="detail text-justify">For all information related to work, taxes, benefits and unemployment support, please visit:<a href="http://www.gov.uk/">www.gov.uk</a> or visit your local Job centre Plus for face-to-face advice.  </div> `
        ]
      },
      {
        title: "Access to healthcare",
        iconMd: "md-medkit",
        detail: [
          `<div class="detail text-justify"><li>All healthcare-related information can be found on the National Healthcare Service (NHS) website.<a href="https://www.nhs.uk/">www.nhs.uk</a></li></div>`,
          `<div class="detail text-justify"><li>See Public Health England’s webpage for useful advice and guidance on the health needs of migrant patients<a href="https://www.gov.uk/guidance/nhs-entitlements-migrant-health-guide">https://www.gov.uk/guidance/nhs-entitlements-migrant-health-guide</a></li></div> `,
          `<div class="detail text-justify"><li>Find a local GP via <a href="https://www.nhs.uk/service-search/GP/LocationSearch/4">https://www.nhs.uk/service-search/GP/LocationSearch/4</a></li></div> `,
          `<div class="detail text-justify"><li>For non-urgent advice about any medical condition visit <a href="https://www.nhs.uk/conditions/">https://www.nhs.uk/conditions/</a></li></div> `,
          `<div class="detail text-justify"><li><b>Emergency number (Ambulance/Police/Fire): Call 999</b></li></div> `,
          `<div class="detail text-justify"><li><b>Mental health crisis:</b> Call 111 (for local crisis team) or go to A&E (place of safety)</li></div> `,
          `<div class="detail text-justify"><li><b>Urgent medical advice number (not an emergency): Call 111 </b></li></div> `,
        ]
      },
      {
        title: "Access to health support",
        iconMd: "md-heart",
        detail: [
          `<div ><b>Mental health support services</b></div>`,
          `<div ><li>For advice and support to empower anyone experiencing a mental health problem.<a href="https://www.mind.org.uk/">https://www.mind.org.uk/</a></li></div>`,
          `<div ><b>Domestic abuse support services</b></div>`,
          `<div ><li>Advice and support for women, children & men experiencing domestic abuse.</li></div>`,
          `<div >
             <ul style="list-style-type: square !important;">
               <li><a href="https://www.refuge.org.uk/">https://www.refuge.org.uk/</a></li>
               <li><a href="https://www.womensaid.org.uk/">https://www.womensaid.org.uk/</a></li>
               <li><a href="https://www.welshwomensaid.org.uk/">https://www.welshwomensaid.org.uk/</a></li>
               <li><a href="http://www.scottishwomensaid.co.uk/">http://www.scottishwomensaid.co.uk/</a></li>
               <li><a href="https://www.womensaid.ie/">https://www.womensaid.ie/</a></li>
             </ul>
           </div>`,
          `<div ><b>Children abuse support services</b></div>`,
          `<div ><li>The National Society for the Prevention of Cruelty to Children - to keep children safe from abuse.<a href="https://www.nspcc.org.uk/">https://www.nspcc.org.uk/</a></li></div>`,
          `<div ><b>Health care and support for refugees, destitute migrants, sex workers and the homeless</b></div>`,
          `<div ><li><a href="https://www.doctorsoftheworld.org.uk/">https://www.doctorsoftheworld.org.uk/</a></li></div>`,
          `<div ><b>LGBT+ support services</b></div>`,
          `<div ><li>Helpline and other advice and information on all immigration and nationality issues for gay men, lesbians, bisexual, transgender and non-binary/gender fluid people.</li></div>`,
          `<div >
             <ul style="list-style-type: square !important;">
               <li><a href="https://uklgig.org.uk/">https://uklgig.org.uk/</a></li>
               <li><a href="https://www.stonewall.org.uk/">https://www.stonewall.org.uk/</a></li>
               <li><a href="https://switchboard.lgbt/">https://switchboard.lgbt/</a></li>
             </ul>
           </div>`
        ]
      },
      {
        title: "Access to community support",
        iconMd: "md-people",
        detail: [
          `<div ><b>Citizens advice</b></div>`,
          `<div ><li>National service that gives free, confidential information and advice to assist people with housing, money, legal, consumer and other problems. <a href="https://www.citizensadvice.org.uk/">https://www.citizensadvice.org.uk/</a></li></div>`,
          `<div ><b>Migrant families network</b></div>`,
          `<div ><li>Help for migrant families in relation to housing and financial support when they have no recourse to public funds. <a href="https://migrantfamilies.nrpfnetwork.org.uk/">https://migrantfamilies.nrpfnetwork.org.uk/</a></li></div>`,
          `<div ><b>International Expat guide</b></div>`,
          `<div ><li>Comprehensive Guide to Britain full of useful tips for migrants coming to work and live in the United Kingdom. <a href="https://www.internations.org/great-britain-expats/guide">https://www.internations.org/great-britain-expats/guide</a></li></div>`,
        ]
      }

    ]
  }

  ionViewDidLoad() {
    this.usage.setPage(this.constructor.name)
    this.learningPageItems = [
      {
        title: "Visas and immigration",
        iconMd: "md-globe",
        detail: [
          `<div class="detail text-justify"> There is one single government website for all your visa and immigration information.</div>`,
          `<a href="https://www.gov.uk/browse/visas-immigration">https://www.gov.uk/browse/visas-immigration</a>`
        ]
      },
      {
        title: "Registering for work",
        iconMd: "md-create",
        detail: [
          `<div class="detail text-justify">For all information related to work, taxes, benefits and unemployment support, please visit:<a href="http://www.gov.uk/">www.gov.uk</a> or visit your local Job centre Plus for face-to-face advice.  </div> `
        ]
      },
      {
        title: "Access to healthcare",
        iconMd: "md-medkit",
        detail: [
          `<div class="detail text-justify"><li>All healthcare-related information can be found on the National Healthcare Service (NHS) website.<a href="https://www.nhs.uk/">www.nhs.uk</a></li></div>`,
          `<div class="detail text-justify"><li>See Public Health England’s webpage for useful advice and guidance on the health needs of migrant patients<a href="https://www.gov.uk/guidance/nhs-entitlements-migrant-health-guide">https://www.gov.uk/guidance/nhs-entitlements-migrant-health-guide</a></li></div> `,
          `<div class="detail text-justify"><li>Find a local GP via <a href="https://www.nhs.uk/service-search/GP/LocationSearch/4">https://www.nhs.uk/service-search/GP/LocationSearch/4</a></li></div> `,
          `<div class="detail text-justify"><li>For non-urgent advice about any medical condition visit <a href="https://www.nhs.uk/conditions/">https://www.nhs.uk/conditions/</a></li></div> `,
          `<div class="detail text-justify"><li><b>Emergency number (Ambulance/Police/Fire): Call 999</b></li></div> `,
          `<div class="detail text-justify"><li><b>Mental health crisis:</b> Call 111 (for local crisis team) or go to A&E (place of safety)</li></div> `,
          `<div class="detail text-justify"><li><b>Urgent medical advice number (not an emergency): Call 111 </b></li></div> `,
        ]
      },
      {
        title: "Access to health support",
        iconMd: "md-heart",
        detail: [
          `<div ><b>Mental health support services</b></div>`,
          `<div ><li>For advice and support to empower anyone experiencing a mental health problem.<a href="https://www.mind.org.uk/">https://www.mind.org.uk/</a></li></div>`,
          `<div ><b>Domestic abuse support services</b></div>`,
          `<div ><li>Advice and support for women, children & men experiencing domestic abuse.</li></div>`,
          `<div >
             <ul style="list-style-type: square !important;">
               <li><a href="https://www.refuge.org.uk/">https://www.refuge.org.uk/</a></li>
               <li><a href="https://www.womensaid.org.uk/">https://www.womensaid.org.uk/</a></li>
               <li><a href="https://www.welshwomensaid.org.uk/">https://www.welshwomensaid.org.uk/</a></li>
               <li><a href="http://www.scottishwomensaid.co.uk/">http://www.scottishwomensaid.co.uk/</a></li>
               <li><a href="https://www.womensaid.ie/">https://www.womensaid.ie/</a></li>
             </ul>
           </div>`,
          `<div ><b>Children abuse support services</b></div>`,
          `<div ><li>The National Society for the Prevention of Cruelty to Children - to keep children safe from abuse.<a href="https://www.nspcc.org.uk/">https://www.nspcc.org.uk/</a></li></div>`,
          `<div ><b>Health care and support for refugees, destitute migrants, sex workers and the homeless</b></div>`,
          `<div ><li><a href="https://www.doctorsoftheworld.org.uk/">https://www.doctorsoftheworld.org.uk/</a></li></div>`,
          `<div ><b>LGBT+ support services</b></div>`,
          `<div ><li>Helpline and other advice and information on all immigration and nationality issues for gay men, lesbians, bisexual, transgender and non-binary/gender fluid people.</li></div>`,
          `<div >
             <ul style="list-style-type: square !important;">
               <li><a href="https://uklgig.org.uk/">https://uklgig.org.uk/</a></li>
               <li><a href="https://www.stonewall.org.uk/">https://www.stonewall.org.uk/</a></li>
               <li><a href="https://switchboard.lgbt/">https://switchboard.lgbt/</a></li>
             </ul>
           </div>`
        ]
      },
      {
        title: "Access to community support",
        iconMd: "md-people",
        detail: [
          `<div ><b>Citizens advice</b></div>`,
          `<div ><li>National service that gives free, confidential information and advice to assist people with housing, money, legal, consumer and other problems. <a href="https://www.citizensadvice.org.uk/">https://www.citizensadvice.org.uk/</a></li></div>`,
          `<div ><b>Migrant families network</b></div>`,
          `<div ><li>Help for migrant families in relation to housing and financial support when they have no recourse to public funds. <a href="https://migrantfamilies.nrpfnetwork.org.uk/">https://migrantfamilies.nrpfnetwork.org.uk/</a></li></div>`,
          `<div ><b>International Expat guide</b></div>`,
          `<div ><li>Comprehensive Guide to Britain full of useful tips for migrants coming to work and live in the United Kingdom. <a href="https://www.internations.org/great-britain-expats/guide">https://www.internations.org/great-britain-expats/guide</a></li></div>`,
        ]
      }

    ]
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
