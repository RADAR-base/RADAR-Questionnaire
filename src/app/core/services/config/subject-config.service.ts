import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'
import { User } from '../../../shared/models/user'

@Injectable()
export class SubjectConfigService {
  private readonly SUBJECT_CONFIG_STORE = {
    PARTICIPANTID: StorageKeys.PARTICIPANTID,
    PARTICIPANTLOGIN: StorageKeys.PARTICIPANTLOGIN,
    PROJECTNAME: StorageKeys.PROJECTNAME,
    SOURCEID: StorageKeys.SOURCEID,
    ENROLMENTDATE: StorageKeys.ENROLMENTDATE,
    BASE_URI: StorageKeys.BASE_URI,
  }

  constructor(public storage: StorageService) {}

  init(user: User) {
    return Promise.all([
      this.setParticipantID(user.humanReadableId),
      this.setProjectName(user.projectId),
      this.setParticipantLogin(user.subjectId),
      this.setSourceID(user.sourceId),
      this.setEnrolmentDate(user.enrolmentDate),
      this.setBaseUrl(user.baseUrl)
    ])
  }

  setParticipantID(id) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.PARTICIPANTID, id)
  }

  setParticipantLogin(login) {
    return this.storage.set(this.SUBJECT_CONFIG_STORE.PARTICIPANTLOGIN, login)
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

  getBaseUrl() {
    return this.storage.get(this.SUBJECT_CONFIG_STORE.BASE_URI)
  }

  reset() {
    return this.storage.clear()
  }
}
