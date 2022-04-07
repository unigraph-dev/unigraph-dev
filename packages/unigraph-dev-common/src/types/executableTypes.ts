import { PackageDeclaration } from './packages';

export type Executable = {
    name?: string;
    'unigraph.id': string;
    src: string;
    env: string;
    periodic?: string;
    on_hook?: string;
    editable?: boolean;
    edited?: boolean;
    children?: any;
    concurrency?: number;
};

export type ExecContext = {
    /** Input parameters in the form of an object */
    params: any;
    /** Package declaration */
    package?: PackageDeclaration;
    /** Definition of the executable */
    definition: Executable;
    showConsole?: boolean;
    /** A function that send events */
    send?: any;
    [x: string]: any;
};
