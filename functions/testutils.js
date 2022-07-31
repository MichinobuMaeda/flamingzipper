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
    update: jest.fn(),
  };

  const mockQueryRef = {
    get: jest.fn(),
  };

  const mockCollectionRef = {
    doc: mockDoc,
    add: jest.fn(),
    // where: jest.fn(function() {
    //   return mockQueryRef;
    // }),
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

  const firebase = {
    auth: function() {
      return mockAuth;
    },
    firestore: function() {
      return {
        collection: mockCollection,
        batch: function() {
          return mockBatch;
        },
      };
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
    firebase,
  };
}

module.exports = {
  createFirestoreDocSnapMock,
  createMockFirebase,
};
