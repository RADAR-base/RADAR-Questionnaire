import { Injectable } from '@angular/core'
import { HealthPlatformBaseService, HealthPlatformService } from './health-platform.base'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { Utility } from 'src/app/shared/utilities/util'
import { QuestionnaireService } from 'src/app/core/services/config/questionnaire.service'
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit'
import { setDateTimeToMidnight, setDateTimeToMidnightEpoch } from 'src/app/shared/utilities/time'

@Injectable({ providedIn: 'root' })
export class HealthkitIosService extends HealthPlatformBaseService implements HealthPlatformService {
    constructor(
        storage: StorageService,
        remoteConfig: RemoteConfigService,
        util: Utility,
        questionnaire: QuestionnaireService
    ) {
        super(storage, remoteConfig, util, questionnaire)
    }

    protected async platformAttemptAuthorization(): Promise<void> {
        await CapacitorHealthkit.requestAuthorization({
            all: [],
            read: this.HEALTHKIT_PERMISSIONS,
            write: []
        })
    }

    protected platformCheckAvailable() {
        return CapacitorHealthkit.isAvailable()
    }

    async query(queryStartTime: Date, queryEndTime: Date, dataType: string) {
        try {
            const startTime = setDateTimeToMidnightEpoch(queryStartTime)
            const endTime = setDateTimeToMidnight(queryEndTime)
            const queryOptions = {
                sampleName: dataType,
                startDate: new Date(startTime).toISOString(),
                endDate: new Date(endTime).toISOString(),
                limit: 0
            }
            return (await CapacitorHealthkit.queryHKitSampleType(queryOptions)).resultData
        } catch (_) {
            return []
        }
    }
}


