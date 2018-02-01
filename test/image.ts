import { should, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
should();
chaiUse(chaiAsPromised);

import * as fs from "fs";
import { imageGet, letterGet } from "../src/image";
import { ImageFile } from "../src/ImageFile";
import { ProviderError } from "../src/ProviderError";

// relative to the workspace
const sampleImageFileName = "test/test.png";

const buildProviderGetObjectFunc = (response: ImageFile) => {
    return (location: string, key: string): Promise<ImageFile> => Promise.resolve(response);
};

const buildProviderGetObjectFailFunc = (code: string) => {
    const err = new ProviderError("has been thrown which is expected for this test");
    err.code = "NoSuchKey";
    return (location: string, key: string): Promise<ImageFile> => Promise.reject(err);
};

describe("`imageGet` test basics", () => {
  it("assert buildProviderGetObjectFunc() setup", () => {
    const result = imageGet(null, null, null, null, null,
        buildProviderGetObjectFunc(new ImageFile(null, null, null, null)));
    return result.should.be.fulfilled;
  });

  it("contentType property matches", () => {
    const contentType = "image/jpg";
    const result = imageGet(null, null, null, null, null,
        buildProviderGetObjectFunc(new ImageFile(null, contentType, null, null)));
    // `Should have resolved: ${result}`
    // console.log(result.should.be.fulfilled);
    // result.should.eventually.be.rejected;
    return result.should.eventually.have.property(
        "contentType",
        contentType,
        `content type did not match ${contentType}`);
  });

  it("provider 'key' error should be caught", () => {
    const expectedCode = "Missing file";
    const result = imageGet(null, null, null, 0, 0,
        buildProviderGetObjectFailFunc(expectedCode));
    return result.should.eventually.be.rejectedWith(
        Error,
        expectedCode,
        "Should have failed with the message 'Missing file'");
  });
});

describe("`imageGet` resize tests", () => {
  it("data should remain unchanged when size not provided", () => {
    const data = new Buffer("something");
    const result = imageGet(null, null, null, 0, 0,
        buildProviderGetObjectFunc(new ImageFile(data, null, null, null)));
    return result.should.eventually.have.property(
        "data",
        data,
        `data did not match original`);
  });

  it("resize skipped if size matches", () => {
    const buffer = fs.readFileSync(sampleImageFileName);
    const result = imageGet(
        null,
        null,
        sampleImageFileName,
        300,
        300,
        buildProviderGetObjectFunc(new ImageFile(buffer, null, null, null)));
    return result.should.eventually.have.property(
        "data",
        buffer,
        "Should have returned the same image");
  }).timeout(750);

  it("resize should have returned a modified image", () => {
    const buffer = fs.readFileSync(sampleImageFileName);
    const result = imageGet(
        null,
        null,
        sampleImageFileName,
        100,
        100,
        buildProviderGetObjectFunc(new ImageFile(buffer, null, null, null)));
    return result.should.eventually.have.property("data")
        .not.equal(buffer, "Should have returned a different image");
  }).timeout(1000);
});

describe("`letterGet` test basics", () => {
  it("letterGet returns a valid data object", () => {
    const result = letterGet("", 50, 50, "#fff", "#000");
    return result.should.eventually.have.property("data")
        .that.has.property("length")
        .that.is.at.least(50, "Data should have been longer");
  }).timeout(2000);
});
