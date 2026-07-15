import { Injectable } from '@angular/core'
import {
  ProtocolDisplayTemplateKey,
  ProtocolEventMetaData
} from 'src/app/shared/models/protocol'

@Injectable({
  providedIn: 'root'
})
export class TemplateRendererService {
  async renderProtocolDisplayName(
    task,
    assessmentMetadata,
    protocolMetaData?: ProtocolEventMetaData
  ): Promise<string> {
    if (!protocolMetaData?.displayTemplate) return ''
    const assessmentIdx =
      task?.assessmentIdx != null ? task.assessmentIdx : 1
    const context = this.buildContext(
      assessmentMetadata,
      protocolMetaData,
      {
        task,
        metadata: assessmentMetadata,
        protocol: protocolMetaData,
        assessmentIdx,
        autoIndex: assessmentIdx
      }
    )
    return this.resolveTemplate(protocolMetaData.displayTemplate, context)
  }

  resolveTemplate(
    template: string,
    context: { [key: string]: any }
  ): string {
    if (!template) return ''
    return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, token) => {
      const value = this.resolveTokenValue(token.trim(), context)
      return value == null ? '' : String(value)
    })
  }

  buildContext(...contexts: any[]) {
    return Object.assign({}, ...contexts)
  }

  private resolveTokenValue(token: string, context: { [key: string]: any }) {
    switch (token as ProtocolDisplayTemplateKey) {
      case ProtocolDisplayTemplateKey.NAME:
        return context.task?.name || ''
      case ProtocolDisplayTemplateKey.PREFIX:
        return context.protocol?.prefix || context.prefix || ''
      case ProtocolDisplayTemplateKey.AUTO_INDEX:
        return context.assessmentIdx
      case ProtocolDisplayTemplateKey.SERIES:
        return context.protocol?.series || context.series || ''
      default:
        return this.getContextValue(context, token)
    }
  }

  private getContextValue(context: { [key: string]: any }, keyPath: string) {
    return keyPath
      .split('.')
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), context)
  }
}
