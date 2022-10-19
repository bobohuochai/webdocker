import { DocumentProxy } from '../interface';
import Document from './document';
import { getSingle } from '../utils';

class Context {
  document: DocumentProxy;

  constructor() {
    this.document = new Document().proxy;
  }
}

export const createContext = getSingle(() => new Context());
