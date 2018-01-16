import { should, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
should();
chaiUse(chaiAsPromised);

import { imageGet } from "../src/image";
import { ImageFile } from "../src/ImageFile";

const buildProviderGetObjectFunc = (response: ImageFile) => {
    return (location: string, key: string): Promise<ImageFile> => Promise.resolve(response);
};

describe("`imageGet` test suite", () => {
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
});
