import { animate, state, style, transition, trigger } from '@angular/animations'

export const TaskInfoAnimations = [
  trigger('fade', [
    state('false', style({ opacity: '0' })),
    state('true', style({ opacity: '1.0' })),
    transition('* => *', animate('350ms ease'))
  ]),
  trigger('scaleMinutes', [
    state(
      'false',
      style({ transform: 'translate3d(48%, -15%, 0) scale(0.45)' })
    ),
    transition('* => *', animate('350ms ease'))
  ]),
  trigger('rotateMeridiem', [
    state('true', style({ transform: 'rotate(90deg)' })),
    state('false', style({ transform: 'translate3d(-20%, 28%, 0)' })),
    transition('* => *', animate('350ms ease'))
  ]),
  trigger('moveHour', [
    state('false', style({ transform: 'translate3d(105%, 0, 0)' })),
    transition('* => *', animate('350ms ease'))
  ]),
  trigger('alignCenterRightExtraInfo', [
    state('false', style({ transform: 'translate3d(8vw, 0, 0) scale(0.8)' })),
    state('true', style({ transform: 'translate3d(0, 0, 0)' })),
    transition('* => *', animate('350ms ease'))
  ]),
  trigger('scaleStatus', [
    state('false', style({ transform: 'scale(0.9)' })),
    transition('* => *', animate('400ms ease'))
  ]),
  trigger('moveInProgress', [
    state('true', style({ transform: 'translate3d(-150%, 0, 0)' })),
    state('false', style({ transform: 'translate3d(0, 0, 0)' })),
    transition('* => *', animate('350ms ease'))
  ]),
  trigger('alignCenterRightMetrics', [
    state('false', style({ transform: 'translate3d(105%, 0, 0)' })),
    state('true', style({ transform: 'translate3d(0, 0, 0)' })),
    transition('* => *', animate('400ms ease'))
  ])
]
