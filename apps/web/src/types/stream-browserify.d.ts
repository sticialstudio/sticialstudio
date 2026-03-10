declare module 'stream-browserify' {
    import * as stream from 'stream';
    export const Duplex: typeof stream.Duplex;
    export const Readable: typeof stream.Readable;
    export const Writable: typeof stream.Writable;
    export const Transform: typeof stream.Transform;
    export const PassThrough: typeof stream.PassThrough;
}
