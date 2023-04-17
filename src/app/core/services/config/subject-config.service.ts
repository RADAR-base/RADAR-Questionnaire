import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultManagementPortalURI,
  DefaultRequestEncodedContentType,
  DefaultRequestJSONContentType,
  DefaultSourceTypeRegistrationBody,
  DefaultSubjectsURI
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { User } from '../../../shared/models/user'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'

@Injectable()
export class SubjectConfigService {
  private readonly SUBJECT_CONFIG_STORE = {
    PARTICIPANTID: StorageKeys.PARTICIPANTID,
    PARTICIPANTLOGIN: StorageKeys.PARTICIPANTLOGIN,
    PARTICIPANT_ATTRIBUTES: StorageKeys.PARTICIPANT_ATTRIBUTES,
    PROJECTNAME: StorageKeys.PROJECTNAME,
    SOURCEID: StorageKeys.SOURCEID,
    ENROLMENTDATE: StorageKeys.ENROLMENTDATE,
    BASE_URI: StorageKeys.BASE_URI
  }

  constructor(
    public storage: StorageService,
    private token: TokenService,
    private http: HttpClient
  ) {}

  init(user: User) {
    return Promise.all([
      this.setParticipantID(user.humanReadableId),
      this.setProjectName(user.projectId),
      this.setParticipantLogin(user.subjectId),
      this.setSourceID(user.sourceId),
      this.setEnrolmentDate(user.enrolmentDate),
      this.setBaseUrl(user.baseUrl),
      this.setParticipantAttributes(user.attributes)
    ])
  }

  setParticipantID(id) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.PARTICIPANTID, id)
  }

  setParticipantLogin(login) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.PARTICIPANTLOGIN, login)
  }

  setParticipantAttributes(attributes) {
    return this.storage.set(
      this.SUBJECT_CONFIG_STORE.PARTICIPANT_ATTRIBUTES,
      attributes
    )
  }

  setEnrolmentDate(date) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.ENROLMENTDATE, date)
  }

  setProjectName(name) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.PROJECTNAME, name)
  }

  setSourceID(id) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.SOURCEID, id)
  }

  setBaseUrl(uri) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.BASE_URI, uri)
  }

  getParticipantID(): Promise<String> {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PARTICIPANTID)
  }

  getEnrolmentDate(): Promise<Number> {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.ENROLMENTDATE)
  }

  getProjectName(): Promise<String> {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PROJECTNAME)
  }

  getSourceID(): Promise<String> {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.SOURCEID)
  }

  getParticipantLogin() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PARTICIPANTLOGIN)
  }

  getParticipantAttributes(): Promise<Map<String, String>> {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PARTICIPANT_ATTRIBUTES)
  }

  getBaseUrl(): Promise<String> {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.BASE_URI)
  }

  getKafkaObservationKey() {
    return Promise.all([
      this.getSourceID(),
      this.getProjectName(),
      this.getParticipantLogin()
    ]).then(([sourceId, projectId, userId]) => {
      return { sourceId, projectId, userId }
    })
  }

  pullSubjectInformation(): Promise<any> {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestEncodedContentType),
      this.token.getDecodedSubject(),
      this.token.getURI()
    ]).then(([headers, subject, uri]) => {
      const subjectURI =
        uri + DefaultManagementPortalURI + DefaultSubjectsURI + subject
      return this.http.get(subjectURI, { headers }).toPromise()
    })
  }

  registerSourceToSubject() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestJSONContentType),
      this.token.getDecodedSubject(),
      this.token.getURI()
    ]).then(([headers, subject, uri]) =>
      this.http
        .post(
          uri +
            DefaultManagementPortalURI +
            DefaultSubjectsURI +
            subject +
            '/sources',
          DefaultSourceTypeRegistrationBody,
          {
            headers
          }
        )
        .toPromise()
    )
  }

  reset() {
    return Promise.all([
      this.setParticipantID(null),
      this.setParticipantLogin(null),
      this.setEnrolmentDate(null),
      this.setProjectName(null),
      this.setSourceID(null),
      this.setBaseUrl(null),
      this.token.setTokens(null),
      this.setParticipantAttributes(null)
    ])
  }
}
