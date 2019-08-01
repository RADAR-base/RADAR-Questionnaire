import { animate, state, style, transition, trigger } from '@angular/animations'

export const HomePageAnimations = [
  trigger('displayCalendar', [
    state('true', style({ transform: 'translateY(0)', opacity: 1 })),
    state('false', style({ transform: 'translateY(100%)', opacity: 0 })),
    transition('*=>*', animate('350ms ease'))
  ]),
  trigger('moveProgress', [
    state('true', style({ transform: 'translateY(-100%)' })),
    state('false', style({ transform: 'translateY(0)' })),
    transition('true=>false', animate('300ms ease-in-out'))
  ])
]
