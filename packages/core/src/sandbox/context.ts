import { DocumentProxy } from '../interface';
import Document from './document';

class Context {
  document: DocumentProxy;

  constructor() {
    this.document = new Document().proxy;
  }
}

let context:Context | null = null;

export function createContext() {
  if (!context) {
    context = new Context();
  }
  return context;
}
