import { Injectable } from '@angular/core';
import { KeyExport } from 'src/app/shared/models/kafka'

@Injectable({
  providedIn: 'root'
})
export abstract class KeyConverterService {
  /**
   * Converts a Kafka key to a record format based on the topic schema.
   * @param kafkaKey The Kafka key to convert.
   * @param topic The topic name to use for schema lookup.
   * @returns A promise resolving to the converted record.
   */
  abstract convertToRecord(kafkaKey: any, topic: string): Promise<any>

  /**
   * Processes the payload into a KeyExport object.
   * @param payload The payload to process.
   * @returns A KeyExport object.
   */
  abstract processData(payload: any): KeyExport

  /**
   * Converts a value to Avro format using the provided schema.
   * @param schema The schema to use for conversion.
   * @param value The value to convert.
   * @returns The Avro-formatted value.
   */
  abstract convertToAvro(schema: any, value: any): any
}
