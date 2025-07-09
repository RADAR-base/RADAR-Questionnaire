import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

interface ProgressUpdate {
  progress: number
  etaText: string
}

interface CompletionData {
  data: any
  isComplete: boolean
  successes: any[]
  errors: Error[]
}

@Injectable()
export class CacheSendService {
  private progress$ = new BehaviorSubject<ProgressUpdate>({ progress: 0, etaText: '' })
  private completion$ = new BehaviorSubject<CompletionData>({
    data: null,
    isComplete: false,
    successes: [],
    errors: []
  })

  getProgress() {
    return this.progress$.asObservable()
  }

  getCompletion() {
    return this.completion$.asObservable()
  }

  updateProgress(progress: number, etaText: string) {
    this.progress$.next({ progress, etaText })
  }

  complete(data: any) {
    this.completion$.next({
      data,
      isComplete: true,
      successes: data['successKeys'] || [],
      errors: data['failedKeys'] || []
    })
  }

  reset() {
    this.progress$.next({ progress: 0, etaText: '' })
    this.completion$.next({
      data: null,
      isComplete: false,
      successes: [],
      errors: []
    })
  }
}