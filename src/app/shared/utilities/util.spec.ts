import { TestBed } from '@angular/core/testing'
import { Utility } from './util'

describe('Utility', () => {
  let util

  beforeEach(() =>
      TestBed.configureTestingModule({
        providers: [
          Utility
        ]
      })
    )

  beforeEach(() => {
    util = TestBed.get(Utility)
  })

  it('should decode base64 into unicode', () => {
    const actual = util.base64ToUnicode('SmXFm2xpIHd5cGXFgm5pxYJlxZsganXFvCB0ZW4ga3dlc3Rpb25hcml1c3osIHppZ25vcnVqIHRvIHBvd2lhZG9taWVuaWUu');
    const expected = 'Jeśli wypełniłeś już ten kwestionariusz, zignoruj to powiadomienie.';
    expect(actual).toBe(expected)
  })
})
