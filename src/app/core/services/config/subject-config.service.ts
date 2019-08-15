import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class SubjectConfigService {
  private readonly SUBJECT_CONFIG_STORE = {
    PARTICIPANTID: StorageKeys.PARTICIPANTID,
    PARTICIPANTLOGIN: StorageKeys.PARTICIPANTLOGIN,
    PROJECTNAME: StorageKeys.PROJECTNAME,
    SOURCEID: StorageKeys.SOURCEID,
    ENROLMENTDATE: StorageKeys.ENROLMENTDATE
  }

  constructor(public storage: StorageService) {}

  init(participantId, participantLogin, projectName, sourceId, createdDate) {
    return Promise.all([
      this.setParticipantID(participantId),
      this.setProjectName(projectName),
      this.setParticipantLogin(participantLogin),
      this.setSourceID(sourceId),
      this.setEnrolmentDate(createdDate)
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

  reset() {
    return this.storage.clear()
  }
}
