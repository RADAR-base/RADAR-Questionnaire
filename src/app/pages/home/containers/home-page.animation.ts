import { animate, state, style, transition, trigger } from '@angular/animations'

export const HomePageAnimations = [
  trigger('displayCalendar', [
    state('true', style({ transform: 'translateY(0)', opacity: 1 })),
    state('false', style({ transform: 'translateY(100%)', opacity: 0 })),
    transition('*=>*', animate('350ms 50ms ease'))
  ]),
  trigger('moveProgress', [
    state('true', style({ transform: 'translateY(-100%)', display: 'none' })),
    state('false', style({ transform: 'translateY(0)' })),
    transition('true=>false', animate('400ms ease'))
  ])
]
