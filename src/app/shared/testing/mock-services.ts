import { Subject } from 'rxjs'

export class StorageServiceMock {
  get(any?) {
    return Promise.resolve('')
  }
  set(any?) {
    return Promise.resolve('')
  }
}
export class TokenServiceMock {
  refresh() {
    return Promise.resolve()
  }

  getURI() {
    return Promise.resolve('')
  }
}
export class RemoteConfigServiceMock {
  subject() {
    return new Subject()
  }
}

export class KeyConverterServiceMock {
  getKafkaTopic() {
    return Promise.resolve()
  }
  getSchemas() {
    return Promise.resolve()
  }
}

export class LogServiceMock {
  log() {}
}

export class ConverterFactoryServiceMock {}

export class ScheduleServiceMock {}
export class NotificationServiceMock {
  init() {}
}
export class ProtocolServiceMock {}
export class QuestionnaireServiceMock {}
export class AppConfigServiceMock {}
export class SubjectConfigServiceMock {}
export class KafkaServiceMock {
  init() {}
}
export class LocalizationServiceMock {}
export class FirebaseAnalyticsServiceMock {}
export class UtilityMock {}
export class FirebaseMock {
  setConfigSettings(settings: any) {
    return
  }
}
export class AppVersionMock {}
export class SchemaServiceMock {}
export class NotificationGeneratorServiceMock {}
export class LocalNotificationsMock {}
export class ScheduleGeneratorServiceMock {}
export class JwtHelperServiceMock {}
export class WebIntentMock {}
export class AppServerServiceMock {}
export class MessageHandlerServiceMock {}
export class GithubClientMock {}
export class CacheServiceMock {}
export class HealthkitServiceMock {}
