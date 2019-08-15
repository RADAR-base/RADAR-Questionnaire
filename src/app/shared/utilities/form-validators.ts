import { FormControl, Validators } from '@angular/forms'

export const URLRegEx = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'

export function isValidURL(URL: string) {
  return !new FormControl(URL, Validators.pattern(URLRegEx)).errors
}
