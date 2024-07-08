/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { BufferBuilder } from "../src/BufferBuilder";

describe("BufferBuilder", () => {
    it("calls the given callback on write", () => {
        const bufBuilder = new BufferBuilder();
        const callbackMock = jest.fn();
        bufBuilder._write(new Uint8Array([1, 2, 3]), "binary", callbackMock);
        expect(callbackMock).toHaveBeenCalled();
    });

    it("calls 'push' on read", () => {
        const bufBuilder = new BufferBuilder();
        const callbackMock = jest.fn();
        const pushMock = jest.spyOn(bufBuilder, "push");
        bufBuilder._write(new Uint8Array([1, 2, 3]), "binary", callbackMock);
        bufBuilder._read(3);
        expect(pushMock).toHaveBeenCalledTimes(2);
    });
});
