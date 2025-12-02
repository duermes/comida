import test from "node:test";
import assert from "node:assert";
import { resolveRoleName, ROLES } from "../src/lib/utils.js";

test("resolveRoleName normalizes slug strings", () => {
  assert.strictEqual(resolveRoleName("Admin"), ROLES.ADMIN);
  assert.strictEqual(resolveRoleName("PROFESOR"), ROLES.PROFESOR);
  assert.strictEqual(resolveRoleName("usuario"), ROLES.USER);
});

test("resolveRoleName detects descriptive labels", () => {
  assert.strictEqual(resolveRoleName("profesor del sistema"), ROLES.PROFESOR);
  assert.strictEqual(resolveRoleName("Docente invitado"), ROLES.PROFESOR);
  assert.strictEqual(resolveRoleName("Coordinadora general"), ROLES.COORD);
  assert.strictEqual(resolveRoleName("Administrador regional"), ROLES.ADMIN);
});

test("resolveRoleName respects populated role objects", () => {
  assert.strictEqual(resolveRoleName({ nombre: "Profesor" }), ROLES.PROFESOR);
  assert.strictEqual(resolveRoleName({ nombre: "Coordinador" }), ROLES.COORD);
});

test("resolveRoleName falls back to known role id aliases", () => {
  assert.strictEqual(resolveRoleName("692665a8147c21b1537b4895"), ROLES.PROFESOR);
});
