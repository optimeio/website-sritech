const realMongoose = require('mongoose');
const mockMongoose = require('./mockMongoose');

let activeMongoose = realMongoose;
const modelProxies = {};

const handler = {
  get(target, prop) {
    if (prop === 'useMock') {
      return () => {
        activeMongoose = mockMongoose;
        console.warn('🔁 Switched to mock database mode using Backend/db.json');
      };
    }
    if (prop === 'useReal') {
      return () => {
        activeMongoose = realMongoose;
        console.warn('🔁 Switched to real MongoDB mongoose');
      };
    }
    if (prop === 'isMock') {
      return () => activeMongoose === mockMongoose;
    }
    if (prop === 'getActive') {
      return () => activeMongoose;
    }
    
    // Get the actual value from active mongoose
    const value = activeMongoose[prop];
    
    // If it's a nested object like Schema, we need to handle it specially
    if (prop === 'Schema') {
      return realMongoose.Schema;
    }
    
    // Intercept model to return a dynamic proxy model
    if (prop === 'model') {
      return (name, schema, ...args) => {
        let realModel;
        try {
          realModel = schema ? realMongoose.model(name, schema, ...args) : realMongoose.model(name);
        } catch(e) {
          realModel = realMongoose.model(name);
        }
        
        let mockModel;
        try {
          mockModel = schema ? mockMongoose.model(name, schema, ...args) : mockMongoose.model(name);
        } catch(e) {
          mockModel = mockMongoose.model(name);
        }

        if (!modelProxies[name]) {
          modelProxies[name] = new Proxy(realModel, {
            get(target, key) {
              const activeModel = activeMongoose === mockMongoose ? mockModel : realModel;
              const val = activeModel[key];
              if (typeof val === 'function') {
                return val.bind(activeModel);
              }
              return val;
            },
            apply(target, thisArg, args) {
              const activeModel = activeMongoose === mockMongoose ? mockModel : realModel;
              return activeModel.apply(thisArg, args);
            },
            construct(target, args) {
              const activeModel = activeMongoose === mockMongoose ? mockModel : realModel;
              return new activeModel(...args);
            }
          });
        }
        return modelProxies[name];
      };
    }
    
    // Only bind actual functions, not classes/constructors
    if (typeof value === 'function' && prop !== 'Schema') {
      return value.bind(activeMongoose);
    }
    return value;
  },
  apply(target, thisArg, args) {
    if (typeof activeMongoose === 'function') {
      return activeMongoose.apply(thisArg, args);
    }
    throw new TypeError('mongoose is not callable');
  },
  has(target, prop) {
    if (prop === 'useMock' || prop === 'isMock' || prop === 'getActive') {
      return true;
    }
    return prop in activeMongoose;
  }
};

const mongooseProxy = new Proxy(realMongoose, handler);
module.exports = mongooseProxy;
