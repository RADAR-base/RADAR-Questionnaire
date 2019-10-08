export function parseVersion(data) {
  // NOTE: Based on current Google Play Store page pattern
  const playstorePattern = /<span class="htlgb">([0-9]*[.][0-9]*[.][0-9]*)<\/span>/g
  const versionPattern = /([0-9]*[.][0-9]*[.][0-9]*)/
  return data
    .match(playstorePattern)
    .toString()
    .match(versionPattern)[0]
}
