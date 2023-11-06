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

import { ProfilesListCommandBuilder } from "../../../../../src";
import { TestLogger } from "../../../../__resources__/src/TestLogger";
import { deleteHandlerPaths, testBuilderProfiles } from "./ProfileBuilderTestConstants";


describe("Profile List Command Builder", () => {
    const logger = TestLogger.getTestLogger();
    it("should provide a valid command definition for the " +
        "profile list command based on our test profile type", () => {
        const firstProfileType = testBuilderProfiles[0];
        let commands = new ProfilesListCommandBuilder(firstProfileType.type, logger, firstProfileType).buildFull();
        commands = deleteHandlerPaths(commands);
        expect(commands).toMatchSnapshot();
    });
});
