import { animate, state, style, transition, trigger } from '@angular/animations'

export const QuestionsPageAnimations = [
  trigger('enterQuestions', [
    state('true', style({ transform: 'translateY(100%)' })),
    state('false', style({ transform: 'translateY(0%)' })),
    transition('*=>*', animate('350ms ease'))
  ])
]
