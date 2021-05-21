import Parser from 'morph-expressions'

export function parseVersion(data) {
  // NOTE: Based on current Google Play Store page pattern
  // TODO: Add support for iOS
  const playstorePattern = /<span class="htlgb">([0-9]*[.][0-9]*[.][0-9]*)<\/span>/g
  const versionPattern = /([0-9]*[.][0-9]*[.][0-9]*)/
  return data
    .match(playstorePattern)
    .toString()
    .match(versionPattern)[0]
  }

// NOTE: Parses and evaluates the branching logic
// Example: '[esm_social_interact(1)] = \"1\" or' or '[esm_social] = '1'' to 'esm_social_interact[1] == "1" ||'
export function parseAndEvalLogic(logic: string, answers): string {
  const TRUE_VAL = '1'
  const parser = new Parser()

  // Parse the branching_logic property in the protocol
  // TODO: Future refactor: move this to REDCap parser
  logic = logic
    .replace(/[[]/g, '')
    .replace(/[\]]/g, '')
    .replace(/\(([0-9A-z""'']+?)\)/g, '[$1]')
    .replace(/[=]/g, '==')
    .replace(/ or /g, ' || ')
    .replace(/ and /g, ' && ')

  // Get identifiers, aka field names and filter unique values
  const compiled = parser.parse(logic)
  const identifiers = compiled.identifiers
    .map(d => d.split('.')[0])
    .filter(onlyUnique)

  // Change multiple answer format to logic format, single answers stay the same
  const parsedAnswers = {}
  identifiers.forEach(fieldName => {
    const answer = answers[fieldName]
    const values = {}
    if (Array.isArray(answer)) {
        if (answer.length == 1 && !logic.includes('[')) {
            Object.assign(parsedAnswers, { [fieldName]: answer[0] })
        } else {
            answer.forEach(a => (values[a] = TRUE_VAL))
            Object.assign(parsedAnswers, { [fieldName]: values })
        }
    } else if (logic.includes('[')) {
        Object.assign(parsedAnswers, { [fieldName]: {answer:'1'} })
    } else {
        Object.assign(parsedAnswers, { [fieldName]: answer })
    }
  })

  // Evalute logic with answers
  return compiled.eval(parsedAnswers)
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}
