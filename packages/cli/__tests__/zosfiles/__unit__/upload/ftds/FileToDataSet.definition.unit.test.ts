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

describe("zos-files upload ftds command definition", () => {
    it ("should not have changed", () => {
        const definition: ICommandDefinition = require("../../../../../src/zosfiles/upload/ftds/FileToDataSet.definition").FileToDataSetDefinition;

        expect(definition).toBeDefined();

        // Should not contain children since this is a command
        expect(definition.children).toBeUndefined();

        // Should require a zosmf profile
        expect(definition.profile.optional).toEqual(["zosmf"]);

        // Should only contain one positional
        expect(definition.positionals.length).toEqual(2);

        // The positionals should be required
        expect(definition.positionals[0].required).toBeTruthy();
        expect(definition.positionals[1].required).toBeTruthy();

        // Should not change
        expect(definition.options).toMatchSnapshot();
        expect(definition.examples).toMatchSnapshot();
    });
});
