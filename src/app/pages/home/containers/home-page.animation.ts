import { animate, state, style, transition, trigger } from '@angular/animations'

export const HomePageAnimations = [
  trigger('displayCalendar', [
    state('true', style({ transform: 'translateY(0%)' })),
    state('false', style({ transform: 'translateY(100%)' })),
    transition('*=>*', animate('300ms ease-out'))
  ]),
  trigger('moveProgress', [
    state('true', style({ transform: 'translateY(-100%)' })),
    state('false', style({ transform: 'translateY(0%)' })),
    transition('*=>*', animate('300ms ease-out'))
  ])
]
