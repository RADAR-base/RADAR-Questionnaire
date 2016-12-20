export interface Question {
  id: string;
  lead: string;
  content: string;
  responses?: Response[];
  range?: Range;
  type: string;
}

export class QuestionType {
  static radio: string = 'radio';
  static range: string = 'range';
  static slider: string = 'slider';
  static audio: string = 'audio';
}

export interface Response {
  response: string;
  score: number;
}

export interface Range {
  min: number;
  max: number;
  step: number;
}
