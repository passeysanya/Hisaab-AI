// Import the library file directly: pdf-parse's index.js runs a debug harness
// that reads a test PDF from disk when bundled.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdf from "pdf-parse";
  export default pdf;
}
