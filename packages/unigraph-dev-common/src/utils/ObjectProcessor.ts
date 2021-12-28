import { Schema, SchemaDgraph, UnigraphTypeString } from '../types/json-ts';

export type ObjectProcessorState = {
    objectType: 'padded' | 'unpadded',
    level: ('value-base' | 'type' | 'value' | 'ref' | 'default')[],
    localSchema: Schema | SchemaDgraph | undefined,
    valueType: UnigraphTypeString
}
