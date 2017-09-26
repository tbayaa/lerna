import log from "npmlog";
// mocked modules
import NpmUtilities from "../src/NpmUtilities";
// helpers
import callsBack from "./helpers/callsBack";
import loggingOutput from "./helpers/loggingOutput";
// file under test
import Package from "../src/Package";

jest.mock("../src/NpmUtilities");

// silence logs
log.level = "silent";

describe("Package", () => {
  let pkg;

  beforeEach(() => {
    pkg = new Package(
      {
        name: "my-package",
        version: "1.0.0",
        bin: "bin.js",
        scripts: { "my-script": "echo 'hello world'" },
        dependencies: { "my-dependency": "^1.0.0" },
        devDependencies: { "my-dev-dependency": "^1.0.0" },
        peerDependencies: { "my-peer-dependency": "^1.0.0" }
      },
      "/path/to/package"
    );
  });

  describe("get .name", () => {
    it("should return the name", () => {
      expect(pkg.name).toBe("my-package");
    });
  });

  describe("get .location", () => {
    it("should return the location", () => {
      expect(pkg.location).toBe("/path/to/package");
    });
  });

  describe("get .version", () => {
    it("should return the version", () => {
      expect(pkg.version).toBe("1.0.0");
    });
  });

  describe("set .version", () => {
    it("should return the version", () => {
      pkg.version = "2.0.0";
      expect(pkg.version).toBe("2.0.0");
    });
  });

  describe("get .bin", () => {
    it("should return the bin", () => {
      expect(pkg.bin).toBe("bin.js");
    });
  });

  describe("get .dependencies", () => {
    it("should return the dependencies", () => {
      expect(pkg.dependencies).toEqual({ "my-dependency": "^1.0.0" });
    });
  });

  describe("get .devDependencies", () => {
    it("should return the devDependencies", () => {
      expect(pkg.devDependencies).toEqual({ "my-dev-dependency": "^1.0.0" });
    });
  });

  describe("get .peerDependencies", () => {
    it("should return the peerDependencies", () => {
      expect(pkg.peerDependencies).toEqual({ "my-peer-dependency": "^1.0.0" });
    });
  });

  describe("get .allDependencies", () => {
    it("should return the combined dependencies", () => {
      expect(pkg.allDependencies).toEqual({
        "my-dependency": "^1.0.0",
        "my-dev-dependency": "^1.0.0"
      });
    });
  });

  describe("get .scripts", () => {
    it("should return the scripts", () => {
      expect(pkg.scripts).toEqual({
        "my-script": "echo 'hello world'"
      });
    });
  });

  describe(".isPrivate()", () => {
    it("should return if the package is private", () => {
      expect(pkg.isPrivate()).toBe(false);
    });
  });

  describe(".set versionSerializer()", () => {
    it("should call 'deserialize' method of serializer'", () => {

      const mockSerializer = {
        serialize: jest.fn((pkg) => {
          return pkg;
        }),
        deserialize: jest.fn((pkg) => {
          return pkg;
        })
      };

      pkg.versionSerializer = mockSerializer;

      expect(mockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(mockSerializer.deserialize.mock.calls[0][0]).toBe(pkg._package);
      expect(mockSerializer.serialize.mock.calls.length).toBe(0);
    });

    it("should call 'serialize' on old and 'deserialize' on new serializer'", () => {

      const firstMockSerializer = {
        serialize: jest.fn((pkg) => {
          return pkg;
        }),
        deserialize: jest.fn((pkg) => {
          return pkg;
        })
      };

      const secondMockSerializer = {
        serialize: jest.fn((pkg) => {
          return pkg;
        }),
        deserialize: jest.fn((pkg) => {
          return pkg;
        })
      };

      pkg.versionSerializer = firstMockSerializer;

      expect(firstMockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(firstMockSerializer.deserialize.mock.calls[0][0]).toBe(pkg._package);
      expect(firstMockSerializer.serialize.mock.calls.length).toBe(0);

      pkg.versionSerializer = secondMockSerializer;

      expect(firstMockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(firstMockSerializer.serialize.mock.calls.length).toBe(1);
      expect(firstMockSerializer.serialize.mock.calls[0][0]).toBe(pkg._package);

      expect(secondMockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(secondMockSerializer.deserialize.mock.calls[0][0]).toBe(pkg._package);
      expect(secondMockSerializer.serialize.mock.calls.length).toBe(0);
    });
  });


  describe(".toJSON()", () => {
    it("should return internal package copy for serialization", () => {
      expect(pkg.toJSON()).toEqual(pkg._package);

      const implicit = JSON.stringify(pkg, null, 2);
      const explicit = JSON.stringify(pkg._package, null, 2);

      expect(implicit).toBe(explicit);
    });

    it("should not change internal package with versionSerializer", () => {
      const mockSerializer = {
        serialize: jest.fn((pkg) => {
          return Object.assign({}, pkg, { foo: true });
        }),
        deserialize: jest.fn((pkg) => {
          const newPkg = Object.assign({}, pkg);
          delete newPkg.foo;
          return newPkg;
        })
      };

      pkg.versionSerializer = mockSerializer;

      let serializedPackage = pkg.toJSON();
      const pkgPackageClone = Object.assign({}, pkg._package, { foo: true });

      expect(serializedPackage).not.toEqual(pkg._package);
      expect(serializedPackage).toEqual(pkgPackageClone);

      expect(mockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(mockSerializer.serialize.mock.calls.length).toBe(1);
      expect(mockSerializer.serialize.mock.calls[0][0]).toEqual(pkg._package);

      serializedPackage = pkg.toJSON();

      expect(serializedPackage).not.toEqual(pkg._package);
      expect(serializedPackage).toEqual(pkgPackageClone);

      expect(mockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(mockSerializer.serialize.mock.calls.length).toBe(2);
      expect(mockSerializer.serialize.mock.calls[0][0]).toEqual(pkg._package);
      expect(mockSerializer.serialize.mock.calls[1][0]).toEqual(pkg._package);
    });

    it("should use versionSerializer.serialize on internal package before return", () => {
      const mockSerializer = {
        serialize: jest.fn((pkg) => {
          return pkg;
        }),
        deserialize: jest.fn((pkg) => {
          return pkg;
        })
      };

      pkg.versionSerializer = mockSerializer;

      expect(pkg.toJSON()).toEqual(pkg._package);

      expect(mockSerializer.deserialize.mock.calls.length).toBe(1);
      expect(mockSerializer.serialize.mock.calls.length).toBe(1);
      expect(mockSerializer.serialize.mock.calls[0][0]).toEqual(pkg._package);
    });
  });

  describe(".runScript()", () => {
    it("should run the script", (done) => {
      NpmUtilities.runScriptInDir = jest.fn(callsBack());

      pkg.runScript("my-script", () => {
        try {
          expect(NpmUtilities.runScriptInDir).lastCalledWith(
            "my-script",
            [],
            pkg.location,
            expect.any(Function)
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe(".runScriptSync()", () => {
    it("should run the script", () => {
      NpmUtilities.runScriptInDirSync = jest.fn(callsBack());

      pkg.runScriptSync("my-script", () => {});

      expect(NpmUtilities.runScriptInDirSync).lastCalledWith(
        "my-script",
        [],
        pkg.location,
        expect.any(Function)
      );
    });
  });

  describe(".hasMatchingDependency()", () => {
    it("should match included dependency", () => {
      expect(pkg.hasMatchingDependency({
        name: "my-dependency",
        version: "1.1.3"
      })).toBe(true);
    });

    it("should not match missing dependency", () => {
      expect(pkg.hasMatchingDependency({ name: "missing", version: "1.0.0" })).toBe(false);
      expect(loggingOutput()).toEqual([]);
    });

    it("should not match included dependency", () => {
      const result = pkg.hasMatchingDependency({
        name: "my-dev-dependency",
        version: "2.0.7"
      }, true);

      expect(result).toBe(false);
      expect(loggingOutput()).toMatchSnapshot();
    });
  });
});
