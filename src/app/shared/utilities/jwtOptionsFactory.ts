import { StorageKeys } from '../enums/storage'

export function jwtOptionsFactory(storage) {
  return {
    tokenGetter: () => {
      return storage.get(StorageKeys.OAUTH_TOKENS.toString())
    }
  }
}
