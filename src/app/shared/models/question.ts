export interface Question {
  branching_logic?: string
  custom_alignment?: string
  evaluated_logic?: string
  field_annotation?: any
  field_label?: string
  field_name?: string
  field_note?: string
  field_type?: string
  form_name?: string
  identifier?: string
  matrix_group_name?: string
  matrix_ranking?: string
  question_number?: string
  required_field?: string
  section_header?: string
  select_choices_or_calculations?: SelectChoicesOrCalculations[]
  text_validation_max?: string
  text_validation_min?: string
  text_validation_type_or_show_slider_number?: string
  type?: string
  range?: Range
  isAutoNext?: boolean
}

export interface ExternalApp {
  branching_logic?: string
  evaluated_logic?: string
  field_label?: string
  field_name?: string
  field_type?: string
  form_name?: string
  type?: string
  external_app_name?: string
  external_app_android_uri?: string
  external_app_ios_uri?: string
}
export interface Health_Requirement {
  data_name: string
  time_intervals: string
  value: string
}

export interface SelectChoicesOrCalculations {
  code: string
  label: string
}

export class QuestionType {
  static checkbox = 'checkbox'
  static radio = 'radio'
  static range = 'range'
  static slider = 'slider'
  static slider_vertical = 'slider-vertical'
  static audio = 'audio'
  static guided_audio = 'guided-audio'
  static timed = 'timed'
  static info = 'info'
  static text = 'text'
  static yesno = 'yesno'
  static descriptive = 'descriptive'
  static matrix_radio = 'matrix-radio'
  static healthkit = 'healthkit'
}

/**
 * Configuration for the guided-audio question type.
 * Set via `field_annotation` in the questionnaire JSON.
 */
export interface GuidedAudioAnnotation {
  /** Automatically read the prompt aloud via TTS when the question becomes visible. */
  auto_tts?: boolean
  /** Optional pre-recorded prompt audio to play instead of TTS. */
  prompt_audio_src?: string
  /** Delay in milliseconds before auto prompt starts (audio file or TTS). */
  prompt_start_delay_ms?: number
  /** Automatically start recording after TTS finishes (requires auto_tts). */
  auto_record_after_tts?: boolean
  /** Fixed recording duration in seconds. 0 = unlimited (manual stop only). */
  record_seconds?: number
  /** Show a "Replay instructions" button (allowed once per item). */
  allow_replay_prompt?: boolean
  /** Hide the on-screen prompt text (`field_label`) while keeping TTS behavior. */
  hide_field_label?: boolean
  /** Show an "Unable to speak" path with reason selection. */
  unable_to_speak_option?: boolean
  /** Optional image stimulus URL displayed above the prompt text. */
  image?: string
}

export interface Response {
  label: string
  code: number | string
}

export interface Range {
  min: number
  max: number
  step?: number
  labelLeft?: string
  labelRight?: string
}

export interface Section {
  code: string
  label: string
}

export interface Item {
  id: string
  response?: string
  value: any
  image?: string
}

export interface InfoItem {
  id: string
  heading: string
  content: string
}

export interface QuestionPosition {
  groupKeyIndex: number
  questionIndices: number[]
}

export enum ValidationType {
  NUMBER = 'number',
  EMAIL = 'email',
  INTEGER = 'integer',
  DATE_DMY = 'date_dmy',
  DATE_MDY = 'date_mdy',
  DATE_YMD = 'date_ymd',
  DATETIME_DMY = 'datetime_dmy',
  DATETIME_MDY = 'datetime_mdy',
  DATETIME_YMD = 'datetime_ymd',
  DURATION = 'duration',
  SECOND = 'second',
  TIME = 'time',
  PHONE = 'phone'
}

/** Dynamic min/max keywords for date and datetime text validation (e.g. today, now). */
export enum DateValidationKeyword {
  TODAY = 'today',
  NOW = 'now'
}

export enum InputModeType {
  TEXT = 'text',
  NUMBER = 'numeric',
  EMAIL = 'email',
  PHONE = 'phone'
}

export enum RequiredField {
  TRUE = 'y',
  FALSE = 'n',
  EMPTY = ''
}

export enum WebInputType {
  NHS = 'nhs'
}
