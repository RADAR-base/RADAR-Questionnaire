export interface Question {
  branching_logic: string
  custom_alignment: string
  evaluated_logic: string
  field_annotation: string
  field_label: string
  field_name: string
  field_note: string
  field_type: string
  form_name: string
  identifier: string
  matrix_group_name: string
  matrix_ranking: string
  question_number: string
  required_field: string
  section_header: string
  select_choices_or_calculations: SelectChoicesOrCalculations[]
  text_validation_max: string
  text_validation_min: string
  text_validation_type_or_show_slider_number: string
}

export interface SelectChoicesOrCalculations {
  code: string
  label: string
}

export class QuestionType {
  static radio = 'radio'
  static range = 'range'
  static slider = 'slider'
  static audio = 'audio'
  static timed = 'timed'
  static info = 'info'
}

export interface Response {
  label: string
  code: number
}

export interface Range {
  min: number
  max: number
  step: number
}

export interface Section {
  section_header: string
  field_label: string
}
