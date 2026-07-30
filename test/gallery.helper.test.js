const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeAccessibility,
  normalizeCollectionRole,
  canAccessCollection,
} = require("../utils/gallery.helper");

test("normalizeAccessibility keeps valid collection visibility values", () => {
  assert.equal(normalizeAccessibility("public"), "public");
  assert.equal(normalizeAccessibility(" shared "), "shared");
  assert.equal(normalizeAccessibility("private"), "private");
});

test("normalizeAccessibility falls back or rejects invalid values", () => {
  assert.equal(normalizeAccessibility(undefined), "shared");
  assert.equal(normalizeAccessibility("unknown"), null);
});

test("normalizeCollectionRole keeps supported roles", () => {
  assert.equal(normalizeCollectionRole("viewer"), "viewer");
  assert.equal(normalizeCollectionRole(" editor "), "editor");
});

test("normalizeCollectionRole falls back or rejects invalid values", () => {
  assert.equal(normalizeCollectionRole(undefined), "viewer");
  assert.equal(normalizeCollectionRole("manager"), null);
});

test("collection access rules match the expected matrix", () => {
  const ownerContext = {
    collection: { accessibility: "private" },
    isOwner: true,
    share: null,
  };

  assert.equal(canAccessCollection(ownerContext, "view"), true);
  assert.equal(canAccessCollection(ownerContext, "add"), true);
  assert.equal(canAccessCollection(ownerContext, "edit"), true);

  const publicViewerContext = {
    collection: { accessibility: "public" },
    isOwner: false,
    share: { role: "viewer" },
  };

  assert.equal(canAccessCollection(publicViewerContext, "view"), true);
  assert.equal(canAccessCollection(publicViewerContext, "add"), false);
  assert.equal(canAccessCollection(publicViewerContext, "edit"), false);

  const sharedEditorContext = {
    collection: { accessibility: "shared" },
    isOwner: false,
    share: { role: "editor", status: "accepted" },
  };

  assert.equal(canAccessCollection(sharedEditorContext, "view"), true);
  assert.equal(canAccessCollection(sharedEditorContext, "add"), true);
  assert.equal(canAccessCollection(sharedEditorContext, "edit"), true);

  const privateSharedContext = {
    collection: { accessibility: "private" },
    isOwner: false,
    share: { role: "editor", status: "accepted" },
  };

  assert.equal(canAccessCollection(privateSharedContext, "view"), false);
  assert.equal(canAccessCollection(privateSharedContext, "add"), false);
  assert.equal(canAccessCollection(privateSharedContext, "edit"), false);

  const pendingInviteContext = {
    collection: { accessibility: "shared" },
    isOwner: false,
    share: { role: "editor", status: "pending" },
  };

  assert.equal(canAccessCollection(pendingInviteContext, "view"), false);
  assert.equal(canAccessCollection(pendingInviteContext, "add"), false);
  assert.equal(canAccessCollection(pendingInviteContext, "edit"), false);
});
