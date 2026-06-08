import * as fs from 'fs';
import * as path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

// Helper to generate a random 24-character hex ID (matching MongoDB format)
export function generateMockId() {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Mock ObjectId class to emulate mongoose.Types.ObjectId
export class MockObjectId {
  private value: string;
  constructor(id?: any) {
    if (id) {
      this.value = id.toString();
    } else {
      this.value = generateMockId();
    }
  }
  toString() {
    return this.value;
  }
  equals(other: any) {
    return this.value === (other ? other.toString() : '');
  }
}

// Read database from local JSON file
async function readDbFile(): Promise<Record<string, any[]>> {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify({}), 'utf-8');
      return {};
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(content || '{}');
  } catch (e) {
    console.error('Error reading mock DB:', e);
    return {};
  }
}

// Write database to local JSON file
async function writeDbFile(data: Record<string, any[]>): Promise<void> {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing mock DB:', e);
  }
}

// Evaluate MongoDB-style query matches
function matchQuery(doc: any, query: any): boolean {
  if (!query) return true;
  for (const key of Object.keys(query)) {
    if (key === '$or') {
      const clauses = query['$or'];
      let match = false;
      for (const clause of clauses) {
        if (matchQuery(doc, clause)) {
          match = true;
          break;
        }
      }
      if (!match) return false;
      continue;
    }

    const val = query[key];
    const docVal = doc[key];

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const op of Object.keys(val)) {
        const opVal = val[op];
        if (op === '$in') {
          const list = Array.isArray(opVal) ? opVal : [];
          const stringList = list.map(x => x.toString());
          if (!docVal) return false;
          if (Array.isArray(docVal)) {
            if (!docVal.some(x => stringList.includes(x.toString()))) return false;
          } else {
            if (!stringList.includes(docVal.toString())) return false;
          }
        } else if (op === '$ne') {
          if (docVal && docVal.toString() === opVal.toString()) return false;
        } else if (op === '$regex') {
          if (!docVal) return false;
          const options = val['$options'] || '';
          const flags = options.includes('i') ? 'i' : '';
          const regex = new RegExp(opVal.toString(), flags);
          if (!regex.test(docVal.toString())) return false;
        }
      }
    } else {
      if (val === null || val === undefined) {
        if (docVal !== null && docVal !== undefined) return false;
      } else if (docVal === null || docVal === undefined) {
        return false;
      } else if (docVal.toString() !== val.toString()) {
        return false;
      }
    }
  }
  return true;
}

// Apply MongoDB-style update modifications
function applyUpdate(doc: any, update: any) {
  for (const key of Object.keys(update)) {
    if (key === '$set') {
      const setVal = update['$set'];
      for (const k of Object.keys(setVal)) {
        doc[k] = setVal[k];
      }
    } else if (key === '$inc') {
      const incVal = update['$inc'];
      for (const k of Object.keys(incVal)) {
        const parts = k.split('.');
        let target = doc;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]]) target[parts[i]] = {};
          target = target[parts[i]];
        }
        const lastKey = parts[parts.length - 1];
        target[lastKey] = (target[lastKey] || 0) + incVal[k];
      }
    } else {
      doc[key] = update[key];
    }
  }
}

// Document wrapper that supports Mongoose-like properties and .save()
export class MockDocument {
  [key: string]: any;
  
  constructor(data: any, private _modelName: string) {
    const cleanData = { ...data };
    if (_modelName === 'User') {
      delete cleanData.avgRating;
    }
    Object.assign(this, cleanData);
    if (!this._id) {
      this._id = generateMockId();
    } else {
      this._id = this._id.toString();
    }
    
    // Set schema default values for Mock mode
    if (this._modelName === 'User') {
      if (!this.rating) {
        this.rating = { total: 0, count: 0 };
      }
      if (!this.skills) {
        this.skills = [];
      }
    }
    
    // Set timestamp strings if not existing
    if (!this.createdAt) this.createdAt = new Date().toISOString();
    if (!this.updatedAt) this.updatedAt = new Date().toISOString();
  }

  get id() {
    return this._id;
  }

  set id(val: any) {
    // ignore/no-op
  }

  get avgRating() {
    if (this._modelName === 'User') {
      const rating = this.rating || { total: 0, count: 0 };
      if (!rating.count || rating.count === 0) return 0;
      return rating.total / rating.count;
    }
    return undefined;
  }

  set avgRating(val: any) {
    // ignore/no-op
  }

  // Allow custom virtual functions in toJSON
  toJSON() {
    const obj: any = { ...this };
    delete obj._modelName;
    if (this._modelName === 'User') {
      obj.avgRating = this.avgRating;
    }
    return obj;
  }

  toObject() {
    return this.toJSON();
  }

  async save() {
    const dbData = await readDbFile();
    const collection = dbData[this._modelName] || [];
    
    this.updatedAt = new Date().toISOString();
    
    const plain = this.toJSON();
    const idx = collection.findIndex((x: any) => x._id === this._id);
    
    if (idx >= 0) {
      collection[idx] = plain;
    } else {
      collection.push(plain);
    }
    
    dbData[this._modelName] = collection;
    await writeDbFile(dbData);
    return this;
  }
}

// Emulates Mongoose query chaining (.populate, .sort, etc.)
export class MockQuery {
  private promise: Promise<any>;

  constructor(promise: Promise<any>) {
    this.promise = promise;
  }

  populate(path: string, select?: string) {
    this.promise = this.promise.then(async (data) => {
      if (!data) return data;
      const isArray = Array.isArray(data);
      const items = isArray ? data : [data];
      const dbData = await readDbFile();

      for (const item of items) {
        if (path === 'matchedHelpers.userId' && item.matchedHelpers) {
          const collection = dbData['User'] || [];
          item.matchedHelpers = item.matchedHelpers.map((mh: any) => {
            if (mh.userId) {
              const matched = collection.find((x: any) => x._id === mh.userId.toString());
              return {
                ...mh,
                userId: matched ? new MockDocument(matched, 'User') : mh.userId
              };
            }
            return mh;
          });
        } else {
          const val = item[path];
          if (val) {
            let refModelName = '';
            if (['seeker', 'acceptedHelper', 'matchedHelpers', 'helper', 'recipient', 'sender'].includes(path)) {
              refModelName = 'User';
            } else if (path === 'request') {
              refModelName = 'HelpRequest';
            }

            if (refModelName) {
              const collection = dbData[refModelName] || [];
              if (Array.isArray(val)) {
                item[path] = val
                  .map((v) => {
                    const idToFind = v.userId ? v.userId.toString() : v.toString();
                    return collection.find((x: any) => x._id === idToFind);
                  })
                  .filter(Boolean)
                  .map((x) => new MockDocument(x, refModelName));
              } else {
                const matched = collection.find((x: any) => x._id === val.toString());
                item[path] = matched ? new MockDocument(matched, refModelName) : null;
              }
            }
          }
        }
      }
      return data;
    });
    return this;
  }

  select(fields: string) {
    return this; // Skip field pruning to keep mock simple
  }

  sort(fields: any) {
    this.promise = this.promise.then((data) => {
      if (!Array.isArray(data)) return data;
      if (typeof fields === 'object') {
        const key = Object.keys(fields)[0];
        const dir = fields[key]; // 1 or -1
        return [...data].sort((a, b) => {
          const valA = a[key] || '';
          const valB = b[key] || '';
          if (valA < valB) return -1 * dir;
          if (valA > valB) return 1 * dir;
          return 0;
        });
      }
      return data;
    });
    return this;
  }

  limit(n: number) {
    this.promise = this.promise.then((data) => {
      if (Array.isArray(data)) {
        return data.slice(0, n);
      }
      return data;
    });
    return this;
  }

  async then(resolve: any, reject?: any) {
    try {
      const res = await this.promise;
      return resolve(res);
    } catch (e) {
      if (reject) return reject(e);
      throw e;
    }
  }
}

// Factory to build a mock model class simulating Mongoose model behavior
export function getMockModel(modelName: string) {
  return class MockModel {
    private doc: MockDocument;
    
    constructor(data: any) {
      this.doc = new MockDocument(data, modelName);
      // Copy fields to instance root
      Object.assign(this, this.doc);
    }

    async save() {
      // Synchronize changes made to instance root back to wrapper
      const self = this as any;
      const plain: Record<string, any> = {};
      for (const key of Object.keys(self)) {
        if (key !== 'doc' && typeof self[key] !== 'function') {
          plain[key] = self[key];
        }
      }
      Object.assign(this.doc, plain);
      const saved = await this.doc.save();
      Object.assign(this, saved);
      return this;
    }

    static create(data: any) {
      const doc = new MockDocument(data, modelName);
      return new MockQuery(
        doc.save().then((saved) => new MockDocument(saved, modelName))
      );
    }

    static find(query: any = {}) {
      return new MockQuery(
        readDbFile().then((dbData) => {
          const list = dbData[modelName] || [];
          return list
            .filter((x: any) => matchQuery(x, query))
            .map((x: any) => new MockDocument(x, modelName));
        })
      );
    }

    static findOne(query: any = {}) {
      return new MockQuery(
        readDbFile().then((dbData) => {
          const list = dbData[modelName] || [];
          const matched = list.find((x: any) => matchQuery(x, query));
          return matched ? new MockDocument(matched, modelName) : null;
        })
      );
    }

    static findById(id: string) {
      return new MockQuery(
        readDbFile().then((dbData) => {
          const list = dbData[modelName] || [];
          const matched = list.find((x: any) => x._id === id.toString());
          return matched ? new MockDocument(matched, modelName) : null;
        })
      );
    }

    static findByIdAndUpdate(id: string, update: any, options?: any) {
      return new MockQuery(
        readDbFile().then(async (dbData) => {
          const list = dbData[modelName] || [];
          const idx = list.findIndex((x: any) => x._id === id.toString());
          if (idx < 0) return null;
          
          const doc = list[idx];
          applyUpdate(doc, update);
          
          dbData[modelName] = list;
          await writeDbFile(dbData);
          return new MockDocument(doc, modelName);
        })
      );
    }

    static findOneAndUpdate(query: any, update: any, options: any = {}) {
      return new MockQuery(
        readDbFile().then(async (dbData) => {
          const list = dbData[modelName] || [];
          const idx = list.findIndex((x: any) => matchQuery(x, query));
          if (idx < 0) return null;
          
          const doc = list[idx];
          applyUpdate(doc, update);
          
          dbData[modelName] = list;
          await writeDbFile(dbData);
          return new MockDocument(doc, modelName);
        })
      );
    }

    static updateMany(query: any, update: any) {
      return new MockQuery(
        readDbFile().then(async (dbData) => {
          const list = dbData[modelName] || [];
          let updatedCount = 0;
          
          for (const doc of list) {
            if (matchQuery(doc, query)) {
              applyUpdate(doc, update);
              updatedCount++;
            }
          }
          
          if (updatedCount > 0) {
            dbData[modelName] = list;
            await writeDbFile(dbData);
          }
          return { modifiedCount: updatedCount };
        })
      );
    }
  };
}
