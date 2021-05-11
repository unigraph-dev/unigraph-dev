/// <reference types="react-scripts" />
declare module "react/jsx-runtime" {
    export default any;
} // TODO: Versioning chores, this is a workaround until better typescript declaration are released.
// See: https://github.com/facebook/create-react-app/issues/10109

declare module '*.pkg' {
    const pkg: any;
    export { pkg };
}