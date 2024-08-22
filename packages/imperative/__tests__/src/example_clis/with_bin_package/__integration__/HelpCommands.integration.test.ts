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

import * as T from "../../../TestUtil";
import { IImperativeConfig } from "../../../../../src/imperative/index";

describe("Imperative help should be available for a range of definitions", function () {
    const cliWithBin = Object.keys(require(__dirname + "/../package.json").bin)[0];
    const cliWithoutBin = __dirname + "/../../with_profiles/ProfileExampleCLI.ts";
    const config: IImperativeConfig = require(__dirname + "/../ProfileBinExampleConfiguration");
    /**
     * Clean up the home directory before and after each test.
     */
    beforeEach(function () {
        T.rimraf(T.TEST_HOME);
    });
    afterEach(function () {
        T.rimraf(T.TEST_HOME);
    });

    it("We should be able to get --help for our example CLI - without bin script", function () {
        T.findExpectedOutputInCommand(cliWithoutBin, ["--help"],
            [config.productDisplayName, "log"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE, undefined, undefined, {
                IMPERATIVE_CALLER_LOCATION: T.TEST_HOME
            });
        T.findExpectedOutputInCommand(cliWithoutBin, ["log", "--help"],
            ["ProfileExampleCLI.ts", "Log example messages", "messages"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE, undefined, undefined, {
                IMPERATIVE_CALLER_LOCATION: T.TEST_HOME
            });
        T.findExpectedOutputInCommand(cliWithoutBin, ["log", "messages", "--help"],
            ["ProfileExampleCLI.ts", "Log example messages", "messages", "level"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE, undefined, undefined, {
                IMPERATIVE_CALLER_LOCATION: T.TEST_HOME
            });
    });

    it("should display --version in the root help", function () {
        T.findExpectedOutputInCommand(cliWithBin, ["--help"],
            [config.productDisplayName, "--version"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE);
    });

    it("We should be able to get --help for our example CLI - with bin script", function () {
        T.findExpectedOutputInCommand(cliWithBin, ["--help"],
            [config.productDisplayName, "ape", "bat", "cat"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE);
        T.findExpectedOutputInCommand(cliWithBin, ["ape", "--help"],
            ["sample-with-bin", "An ape eats grapes"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE);
        T.findExpectedOutputInCommand(cliWithBin, ["ape", "grape", "--help"],
            ["sample-with-bin", "--grape-color", "the color of the grapes eaten by the ape"], "stdout", true,
            this, T.CMD_TYPE.INTERACTIVE);
    });
});
