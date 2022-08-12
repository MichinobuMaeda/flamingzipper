/**
 * Mock object of Firesore doc.
 * @param {object} jest object of jest
 * @param {string} id ID of doc
 * @return {object} Mock object
 */
function createFirestoreDocSnapMock(jest, id) {
  return {
    id,
    exists: true,
    data: jest.fn(),
    get: jest.fn(function(key) {
      return this.data()[key];
    }),
    ref: {
      update: jest.fn(),
      set: jest.fn(),
    },
  };
}

/**
 * Mock object of Firebase.
 * @param {object} jest object of jest
 * @return {object} Mock object
 */
function createMockFirebase(jest) {
  const mockAuth = {
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    createCustomToken: jest.fn(),
  };

  const mockDoc = jest.fn(function() {
    return mockDocRef;
  });

  const mockDocRef = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  };

  const mockQueryRef = {
    get: jest.fn(),
    orderBy: jest.fn(function() {
      return mockQueryRef;
    }),
    limit: jest.fn(function() {
      return mockQueryRef;
    }),
  };

  const mockCollectionRef = {
    doc: mockDoc,
    add: jest.fn(),
    where: jest.fn(function() {
      return mockQueryRef;
    }),
  };

  const mockCollection = jest.fn(function() {
    return mockCollectionRef;
  });

  const mockBatch = {
    commit: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  };

  const mockBucketFileSave = jest.fn();
  const mockBucketFileCopy = jest.fn();
  const mockBucketFileExists = jest.fn();
  const mockBucketFile = jest.fn(function() {
    return {
      save: mockBucketFileSave,
      copy: mockBucketFileCopy,
      exists: mockBucketFileExists,
    };
  });

  const firebase = {
    auth: mockAuth,
    db: {
      collection: mockCollection,
      batch: function() {
        return mockBatch;
      },
    },
    bucket: {
      file: mockBucketFile,
    },
    logger: {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  };

  return {
    mockAuth,
    mockDoc,
    mockDocRef,
    mockQueryRef,
    mockCollectionRef,
    mockCollection,
    mockBatch,
    mockBucketFile,
    mockBucketFileSave,
    mockBucketFileCopy,
    mockBucketFileExists,
    firebase,
  };
}

module.exports = {
  createFirestoreDocSnapMock,
  createMockFirebase,
};
