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

import { ICommandDefinition } from "@zowe/core-for-zowe-sdk";

describe("daemon restart definition", () => {
    it("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../../src/daemon/restart/Restart.definition").RestartCommand;
        expect(definition).toBeDefined();
        delete definition.handler;

        // Should not contain children since this is a command
        expect(definition.children).toBeUndefined();

        expect(definition).toMatchSnapshot();
    });
});
