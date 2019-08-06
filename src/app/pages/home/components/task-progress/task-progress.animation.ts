import { animate, state, style, transition, trigger } from '@angular/animations'

export const TaskProgressAnimations = [
  trigger('enterAnimation', [
    transition(':enter', [
      style({ transform: 'translateX(100%)', opacity: 0 }),
      animate('500ms', style({ transform: 'translateX(0)', opacity: 1 }))
    ])
  ]),
  trigger('translateY', [
    state('true', style({ transform: 'translateY(32vh)', opacity: 1 })),
    state('false', style({ transform: 'translateY(0)', opacity: 1 })),
    transition('true <=> false', animate('1s linear'))
  ])
]
