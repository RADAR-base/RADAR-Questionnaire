import { animate, state, style, transition, trigger } from '@angular/animations'

export const TaskInfoAnimations = [
  trigger('fade', [
    state('false', style({ opacity: '0', })),
    state('true', style({ opacity: '1', })),
    transition('* => *', animate('400ms ease'))
  ]),
  trigger('scaleMinutes', [
    state(
      'false',
      style({ transform: 'translate3d(-25%, -15%, 0) scale(0.4)', })
    ),
    state('true', style({ transform: 'translate3d(0, 0, 0) scale(1)', })),
    transition('* => *', animate('400ms ease'))
  ]),
  trigger('alignCenterRightExtraInfo', [
    state('false', style({ transform: 'translate3d(15%, 0, 0)', })),
    state('true', style({ transform: 'translate3d(0, 0, 0)', })),
    transition('* => *', animate('400ms ease'))
  ]),
  trigger('alignCenterRightTime', [
    state('false', style({ transform: 'translate3d(8%, 0, 0) scale(0.8)', })),
    state('true', style({ transform: 'translate3d(0, 0, 0)', })),
    transition('* => *', animate('400ms ease'))
  ]),
  trigger('moveInProgress', [
    state(
      'true',
      style({ display: 'none', transform: 'translate3d(-150%, 0, 0)', })
    ),
    state(
      'false',
      style({ display: 'block', transform: 'translate3d(0, 0, 0)', })
    ),
    transition('* => *', animate('400ms ease'))
  ]),
  trigger('alignCenterRightMetrics', [
    state('false', style({ transform: 'translate3d(110%, 0, 0)', })),
    state('true', style({ transform: 'translate3d(0, 0, 0)', })),
    transition('* => *', animate('400ms ease'))
  ])
]
