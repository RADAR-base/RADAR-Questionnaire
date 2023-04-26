import Parser from 'morph-expressions'

export function parseVersion(data) {
  // NOTE: Based on current Google Play Store page pattern
  // TODO: Add support for iOS
  const playstorePattern =
    /<span class="htlgb">([0-9]*[.][0-9]*[.][0-9]*)<\/span>/g
  const versionPattern = /([0-9]*[.][0-9]*[.][0-9]*)/
  return data.match(playstorePattern).toString().match(versionPattern)[0]
}

// NOTE: Parses and evaluates the branching logic
// Example: '[esm_social_interact(1)] = \"1\" or' or '[esm_social] = '1'' to 'esm_social_interact[1] == "1" ||'
export function parseAndEvalLogic(logic: string, answers): string {
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
    let answer = answers[fieldName]
    // Get type of the expression right operand and make answer match this type
    const logicType = typeof getRightOperand(fieldName, logic)
    if (Array.isArray(answer)) {
      answer.forEach(a => {
        a = convertToCorrectType(logicType, a)
        const parsed = { [fieldName]: a }
        if (compiled.eval(parsed)) Object.assign(parsedAnswers, parsed)
      })
    } else {
      answer = convertToCorrectType(logicType, answer)
      Object.assign(parsedAnswers, { [fieldName]: answer })
    }
  })

  // Evalute logic with answers
  return compiled.eval(parsedAnswers)
}

function getRightOperand(identifier: string, expression: string) {
  // This fucntion gets the type of the right operand (e.g. height == '0' -> string)
  const result = expression.split(identifier)[1].replace(/ /g, '')
  const breakpoint = /\==/
  const rightOperand = result.split(breakpoint)[1]
  try {
    return JSON.parse(rightOperand)
  } catch (e) {
    return rightOperand
  }
}

function convertToCorrectType(type: string, value) {
  if (type == 'string') return String(value)
  if (type == 'number') return Number(value)
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}
