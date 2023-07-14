import { FormControl, Validators } from '@angular/forms'

export const URLRegEx = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'

export function isValidURL(URL: string) {
  return !new FormControl(URL, Validators.pattern(URLRegEx)).errors
}

export function isValidNHSId(nhsId: string) {
  const checksum = calculateNHSChecksum(nhsId)
  const lastDigit: number = parseInt(nhsId[9], 10)
  return checksum === lastDigit
}

export function calculateNHSChecksum(nhsId: string): number {
  nhsId = nhsId.replace(/\s/g, '') // Remove any spaces
  if (nhsId.length !== 10) {
    throw new Error('Invalid NHS ID length. Expected length is 10.')
  }
  const weights: number[] = [10, 9, 8, 7, 6, 5, 4, 3, 2] // Weights for each digit
  const total: number = nhsId
    .split('')
    .map((digit, index) => parseInt(digit, 10) * weights[index])
    .slice(0, 9)
    .reduce((acc, curr) => acc + curr, 0)
  const checksum: number = (11 - (total % 11)) % 11
  return checksum
}
