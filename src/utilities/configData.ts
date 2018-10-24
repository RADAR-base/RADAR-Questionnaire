// tslint:disable:max-line-length
export const ConfigData = {
  version: 0.49,
  assessments: [
    {
      name: 'PHQ8',
      showIntroduction: 'true',
      startText:
        'This questionnaire is known as the PHQ8. Clinicians use it to assess current depression in patients. Please note that none of your answers will be collected today. Thank you for taking part in this focus group.',
      endText: 'In light of this focus group, none of your answers were saved.',
      warn: '',
      estimatedCompletionTime: 7,
      protocol: {
        reminders: {
          amount: 15,
          repeat: 2,
          unit: 'min'
        },
        repeatProtocol: {
          amount: 1,
          unit: 'day'
        },
        repeatQuestionnaire: {
          unit: 'min',
          unitsFromZero: [600, 950, 1050]
        }
      },
      questions: [
        {
          content: 'Little interest or pleasure in doing things.',
          id: 'PHQ8-0',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content: 'Feeling down, depressed, or hopeless.',
          id: 'PHQ8-1',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content:
            'Trouble falling asleep or staying asleep, or sleeping too much.',
          id: 'PHQ8-2',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content: 'Feeling tired or having little energy.',
          id: 'PHQ8-3',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content:
            'Feeling bad about yourself – or that you are a failure or have let yourself or your family down.',
          id: 'PHQ8-4',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content:
            'Trouble concentrating on things such as reading the newspaper of watching television.',
          id: 'PHQ8-5',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content:
            'Moving or speaking so slowly that other people have noticed. Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual.',
          id: 'PHQ8-6',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        }
      ]
    },
    {
      name: 'DEMO',
      showIntroduction: 'true',
      startText:
        'This questionnaire allows you to test all available input types.',
      endText:
        'Thanks for giving it a try! Feel free to tell us about your app experience.',
      warn: 'Requires a quiet space',
      estimatedCompletionTime: 2,
      protocol: {
        reminders: {
          amount: 15,
          repeat: 1,
          unit: 'min'
        },
        repeatProtocol: {
          amount: 1,
          unit: 'day'
        },
        repeatQuestionnaire: {
          unit: 'min',
          unitsFromZero: [920, 1100, 1300]
        }
      },
      questions: [
        {
          content:
            'This test helps us assess your balancing skills in a still position.',
          id: 'Test-4',
          lead: "Romberg's Test",
          sections: [
            {
              content:
                'Make yourself comfortable, and in standing position. Your feet should be together and your hands by your side.',
              heading: 'Part 1'
            },
            {
              content:
                'Press the start button. A timer will count down the seconds.',
              heading: 'Part 2'
            },
            {
              content:
                'After 10 seconds, a beep will alert you to continue the exercise with your eyes closed.',
              heading: 'Part 3'
            }
          ],
          type: 'info'
        },
        {
          content:
            'This test helps us assess your balancing skills in a still position.',
          heading: 'Keep your eyes open',
          id: 'Test-5',
          image: 'assets/imgs/eyesopen.png',
          lead: "Romberg's Test",
          timer: {
            end: 11,
            start: 20
          },
          type: 'timed',
          unit: 'sec'
        },
        {
          content:
            'This test helps us assess your balancing skills in a still position.',
          heading: 'Close your eyes',
          id: 'Test-6',
          image: 'assets/imgs/eyesclosed.png',
          lead: "Romberg's Test",
          timer: {
            end: 0,
            start: 10
          },
          type: 'timed',
          unit: 'sec'
        },
        {
          content: 'Little interest or pleasure in doing things.',
          id: 'Test-0',
          lead:
            'Over the past two weeks, how often have you been bothered by any of the following problems?',
          responses: [
            {
              response: 'Not at all',
              score: 0
            },
            {
              response: 'Several days',
              score: 1
            },
            {
              response: 'More than half the days',
              score: 2
            },
            {
              response: 'Nearly every day',
              score: 3
            }
          ],
          type: 'radio'
        },
        {
          content: 'The slider as fine-grained input.',
          id: 'Test-1',
          lead: 'Some other input types.',
          range: {
            max: 100,
            min: 0,
            step: 5
          },
          type: 'slider'
        },
        {
          content: 'The multiple values for a smaller range.',
          id: 'Test-2',
          lead: 'Some other input types.',
          range: {
            max: 7,
            min: 1
          },
          type: 'range'
        }
      ]
    }
  ]
}
