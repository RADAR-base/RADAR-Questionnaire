import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { User } from '../../../shared/models/user'
import { StorageService } from '../storage/storage.service'

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

  constructor(public storage: StorageService) {}

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

  getParticipantID() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PARTICIPANTID)
  }

  getEnrolmentDate() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.ENROLMENTDATE)
  }

  getProjectName() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PROJECTNAME)
  }

  getSourceID() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.SOURCEID)
  }

  getParticipantLogin() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PARTICIPANTLOGIN)
  }

  getParticipantAttributes() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.PARTICIPANT_ATTRIBUTES)
  }

  getBaseUrl() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.BASE_URI)
  }

  reset() {
    return this.storage.clear()
  }
}
