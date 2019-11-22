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

// NOTE: Parses the branching logic
// NOTE: Example: '[esm_social_interact(1)] = \"1\" or' or '[esm_social] = '1'' to 'esm_social_interact[1]="1" ||'
export function parseLogic(logic: string): string {
  const hasMultExpressions = logic.includes('(')
  const TRUE_VAL = '1'
  if (!hasMultExpressions)
    return `${logic.split('[')[1].split(']')[0]}[${
      logic.split(' = ')[1]
    }] == "${TRUE_VAL}"`
  return logic
    .replace(/[[]/g, '')
    .replace(/[\]]/g, '')
    .replace(/[(]/g, '[')
    .replace(/[)]/g, ']')
    .replace(/[=]/g, '==')
    .replace(/or/g, '||')
}
