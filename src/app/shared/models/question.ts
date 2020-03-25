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
  static audio = 'adio'
  static timed = 'timed'
  static timed_manual = 'timed-manual'
  static info = 'info'
  static text = 'text'
  static yesno = 'yesno'
}

export interface Response {
  label: string
  code: number
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
}

export interface InfoItem {
  id: string
  heading: string
  content: string
}
