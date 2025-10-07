import { Injectable } from '@angular/core'
import { HealthPlatformBaseService, HealthPlatformService } from './health-platform.base'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { Utility } from 'src/app/shared/utilities/util'
import { QuestionnaireService } from 'src/app/core/services/config/questionnaire.service'
import { Platform } from '@ionic/angular'
import { HealthConnect } from 'capacitor-health-connect'

@Injectable({ providedIn: 'root' })
export class HealthConnectAndroidService extends HealthPlatformBaseService implements HealthPlatformService {
    constructor(
        storage: StorageService,
        remoteConfig: RemoteConfigService,
        util: Utility,
        questionnaire: QuestionnaireService,
        private platform: Platform
    ) {
        super(storage, remoteConfig, util, questionnaire)
    }

    protected async platformAttemptAuthorization(): Promise<void> {
        if (!this.platform.is('android')) return
        await HealthConnect.requestHealthPermissions({
            read: this.mapPermissionsForAndroid(),
            write: []
        })
    }

    protected platformCheckAvailable() {
        return HealthConnect.checkAvailability()
    }

    // Map iOS-centric permission names to Health Connect record types
    private mapPermissionsForAndroid(): any[] {
        // Basic mapping of commonly used metrics; extend as needed
        const map = {
            steps: 'Steps',
            distanceWalkingRunning: 'Distance',
            distanceCycling: 'Distance',
            activeCalories: 'ActiveCaloriesBurned',
            basalCalories: 'BasalMetabolicRate',
            heartRate: 'HeartRateSeries',
            weight: 'Weight',
            sleepAnalysis: 'SleepSession',
        } as Record<string, string>
        return this.HEALTHKIT_PERMISSIONS.map(key => map[key] || 'Steps')
    }

    async query(queryStartTime: Date, queryEndTime: Date, dataType: string) {
        try {
            const startTime = new Date(queryStartTime)
            const endTime = new Date(queryEndTime)
            const recordType = this.mapSampleNameToAndroidRecordType(dataType)
            if (!recordType) return []
            const result: any = await (HealthConnect as any).readRecords({
                type: recordType,
                timeRangeFilter: { type: 'between', startTime, endTime },
                ascendingOrder: true
            })
            const records = (result && result.records) ? result.records : (Array.isArray(result) ? result : [])
            return records.map((r: any) => this.transformAndroidRecordToIosShape(recordType, r)).filter(Boolean)
        } catch (_) {
            return []
        }
    }

    private mapSampleNameToAndroidRecordType(sampleName: string): string | null {
        const map: Record<string, string> = {
            stepCount: 'Steps',
            distanceWalkingRunning: 'Distance',
            distanceCycling: 'Distance',
            activeEnergyBurned: 'ActiveCaloriesBurned',
            basalEnergyBurned: 'BasalMetabolicRate',
            heartRate: 'HeartRateSeries',
            weight: 'Weight',
            sleepAnalysis: 'SleepSession'
        }
        return map[sampleName] || null
    }

    private transformAndroidRecordToIosShape(recordType: string, r: any): any {
        const base = {
            startDate: (r.startTime || r.startDate) ? new Date(r.startTime || r.startDate).toISOString() : undefined,
            endDate: (r.endTime || r.endDate) ? new Date(r.endTime || r.endDate).toISOString() : undefined,
            sourceBundleId: 'android.health.connect',
            source: 'Health Connect',
            unitName: ''
        }
        let value: number | string | null = null
        switch (recordType) {
            case 'Steps':
                value = r.count ?? r.value ?? null
                break
            case 'ActiveCaloriesBurned':
                value = r.energy?.value ?? r.value ?? null
                base.unitName = r.energy?.unit || ''
                break
            case 'BasalMetabolicRate':
                value = r.basalMetabolicRate?.value ?? r.value ?? null
                base.unitName = r.basalMetabolicRate?.unit || ''
                break
            case 'Distance':
                value = r.distance?.value ?? r.value ?? null
                base.unitName = r.distance?.unit || ''
                break
            case 'HeartRateSeries':
                if (Array.isArray(r.samples) && r.samples.length) {
                    const avg = r.samples.reduce((s: number, x: any) => s + (x.beatsPerMinute || 0), 0) / r.samples.length
                    value = Math.round(avg)
                } else {
                    value = r.beatsPerMinute ?? r.value ?? null
                }
                break
            case 'Weight':
                value = r.weight?.value ?? r.value ?? null
                base.unitName = r.weight?.unit || ''
                break
            case 'SleepSession':
                value = r.stage ?? r.value ?? null
                break
            default:
                value = r.value ?? null
        }
        if (value === null || base.startDate === undefined || base.endDate === undefined) return null
        return { ...base, value }
    }
}


