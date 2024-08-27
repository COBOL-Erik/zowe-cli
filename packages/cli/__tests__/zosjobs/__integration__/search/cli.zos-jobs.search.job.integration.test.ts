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

import { ITestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestPropertiesSchema } from "../../../../../../__tests__/__src__/properties/ITestPropertiesSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("zos-jobs search job command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_search_job_content_command",
            skipProperties: true
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", () => {
        const response = runCliScript(__dirname + "/__scripts__/job/job_help.sh",
            TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    describe("syntax errors", () => {
        it("should occur if any search parameter is missing", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/job_syntax_missing_parms.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if an extra unknown option is specified", () => {
            const response = runCliScript(__dirname + "/__scripts__/job/job_syntax_invalid_parm.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain('Unknown argument: blah');
            expect(response.stderr.toString()).toContain('Command failed due to improper syntax');
            expect(response.stderr.toString()).toContain('Command entered: "zos-jobs search job JOB123 blah ' +
                '--host fakehost --user fakeuser --password fakepass"');
            expect(response.stderr.toString()).toContain('Available commands are "job".');
            expect(response.stderr.toString()).toContain('Use "zowe zos-jobs search --help" to view groups, commands, and options.');
            expect(response.stderr.toString()).toMatchSnapshot();
        });
    });

});