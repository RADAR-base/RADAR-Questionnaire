export class StorageKeys {

    constructor(public value:string){
    }
    toString(){
        return this.value;
    }
    // values
    static REFERENCEDATE = new StorageKeys('REFERENCEDATE');
    static OAUTH_TOKENS = new StorageKeys('OAUTH_TOKENS');
    static PARTICIPANTID = new StorageKeys('PARTICIPANTID');
    static PARTICIPANTLOGIN = new StorageKeys('PARTICIPANTLOGIN');
    static PROJECTNAME = new StorageKeys('PROJECTNAME');
    static SOURCEID = new StorageKeys('SOURCEID')
    static LANGUAGE = new StorageKeys('LANGUAGE');
    static SETTINGS_NOTIFICATIONS = new StorageKeys('SETTINGS_NOTIFICATIONS');
    static SETTINGS_LANGUAGES = new StorageKeys('SETTINGS_LANGUAGES');
    static SETTINGS_WEEKLYREPORT = new StorageKeys('SETTINGS_WEEKLYREPORT')
    static CONFIG_VERSION = new StorageKeys('CONFIG_VERSION')
    static CONFIG_ASSESSMENTS = new StorageKeys('CONFIG_ASSESSMENTS')
    static SCHEDULE_VERSION = new StorageKeys('SCHEDULE_VERSION')
    static SCHEDULE_TASKS = new StorageKeys('SCHEDULE_TASKS')
    static SCHEDULE_TASKS_CLINICAL = new StorageKeys('SCHEDULE_TASKS_CLINICAL')
    static SCHEDULE_REPORT = new StorageKeys('SCHEDULE_REPORT')
    static CACHE_ANSWERS = new StorageKeys('CHACHE_ANSWERS')
    static HAS_CLINICAL_TASKS = new StorageKeys('HAS_CLINICAL_TASKS')
    static CONFIG_CLINICAL_ASSESSMENTS = new StorageKeys('CONFIG_CLINICAL_ASSESSMENTS')
}
