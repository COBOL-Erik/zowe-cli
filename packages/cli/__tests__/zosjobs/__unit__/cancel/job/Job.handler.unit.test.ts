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

jest.mock("@zowe/zos-jobs-for-zowe-sdk");
import { IHandlerParameters, ImperativeError, Session } from "@zowe/imperative";
import { GetJobs, CancelJobs, IJobFeedback } from "@zowe/zos-jobs-for-zowe-sdk";
import { GetJobsData } from "../../../__resources__/GetJobsData";
import * as JobHandler from "../../../../../src/zosjobs/cancel/job/Job.handler";
import * as JobDefinition from "../../../../../src/zosjobs/cancel/job/Job.definition";
import {
    UNIT_TEST_ZOSMF_PROF_OPTS,
    getMockedResponse,
    UNIT_TEST_PROFILES_ZOSMF
} from "../../../../../../../__tests__/__src__/mocks/ZosmfProfileMock";

process.env.FORCE_COLOR = "0";

const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {
        $0: "bright",
        _: ["zos-jobs", "cancel", "job"],
        ...UNIT_TEST_ZOSMF_PROF_OPTS
    },
    positionals: ["zos-jobs", "cancel", "job"],
    response: getMockedResponse(),
    definition: JobDefinition.JobDefinition,
    fullDefinition: JobDefinition.JobDefinition,
    profiles: UNIT_TEST_PROFILES_ZOSMF
};

const DEFAULT_RESPONSE_FEEDBACK: any = {
    jobid: undefined,
    jobname: undefined,
    "original-jobid": undefined,
    owner: undefined,
    member: undefined,
    sysname: undefined,
    "job-correlator": undefined,
    status: "0",
    "internal-code": undefined,
    message: undefined
};

const DEFAULT_RESPONSE_FEEDBACK_2: IJobFeedback = {
    jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
    jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
    "original-jobid": GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
    owner: GetJobsData.SAMPLE_COMPLETE_JOB.owner,
    member: "fakemem",
    sysname: "fakesys",
    "job-correlator": GetJobsData.SAMPLE_COMPLETE_JOB["job-correlator"],
    status: "0",
    "internal-code": "0",
    message: ""
};

const DEFAULT_RESPONSE_FEEDBACK_2_BAD: IJobFeedback = {
    jobid: GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
    jobname: GetJobsData.SAMPLE_COMPLETE_JOB.jobname,
    "original-jobid": GetJobsData.SAMPLE_COMPLETE_JOB.jobid,
    owner: GetJobsData.SAMPLE_COMPLETE_JOB.owner,
    member: "fakemem",
    sysname: "fakesys",
    "job-correlator": GetJobsData.SAMPLE_COMPLETE_JOB["job-correlator"],
    status: "1",
    "internal-code": "12",
    message: "An internal error occurred."
};

describe("cancel job handler tests", () => {
    it("should be able to cancel a job by job id", async () => {
        let passedSession: Session;
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        CancelJobs.cancelJobForJob = jest.fn(async (session, job) => {
            return DEFAULT_RESPONSE_FEEDBACK;
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments]);
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(CancelJobs.cancelJobForJob).toHaveBeenCalledWith(
            passedSession,
            GetJobsData.SAMPLE_COMPLETE_JOB,
            params.arguments.version
        );
    });

    it("should be able to cancel a job by job id version 2.0", async () => {
        let passedSession: Session;
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        CancelJobs.cancelJobForJob = jest.fn(async (session, job) => {
            return DEFAULT_RESPONSE_FEEDBACK_2;
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments], {modifyVersion: "2.0"});
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        await handler.process(params);
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(CancelJobs.cancelJobForJob).toHaveBeenCalledWith(
            passedSession,
            GetJobsData.SAMPLE_COMPLETE_JOB,
            params.arguments.modifyVersion
        );
    });

    it("should fail to cancel a job by job id version 2.0", async () => {
        let passedSession: Session;
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            passedSession = session;
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        CancelJobs.cancelJobForJob = jest.fn(async (session, job) => {
            return DEFAULT_RESPONSE_FEEDBACK_2_BAD;
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        params.arguments = Object.assign({}, ...[DEFAULT_PARAMETERS.arguments], {modifyVersion: "2.0"});
        params.arguments.jobid = GetJobsData.SAMPLE_COMPLETE_JOB.jobid;
        let error;
        try {
            await handler.process(params);
        } catch (e) {
            error = e;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(CancelJobs.cancelJobForJob).toHaveBeenCalledWith(
            passedSession,
            GetJobsData.SAMPLE_COMPLETE_JOB,
            params.arguments.modifyVersion
        );
        expect(error).toBeDefined();
        expect(error.message).toEqual("Failed to cancel job IBMUSER$ (TSUxxx)");
        expect(error.errorCode).toEqual("12");
        expect(error.additionalDetails).toContain("An internal error occurred.");
    });

    it("should not transform an error from the zosmf rest client", async () => {
        const failMessage = "You fail in z/OSMF";
        let error;
        GetJobs.getJob = jest.fn((session, jobid) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });

    it("should not transform an error from the CancelJobs API class", async () => {
        const failMessage = "You fail in CancelJobs";
        let error;
        GetJobs.getJob = jest.fn(async (session, jobid) => {
            return GetJobsData.SAMPLE_COMPLETE_JOB;
        });
        CancelJobs.cancelJobForJob = jest.fn((session, job) => {
            throw new ImperativeError({ msg: failMessage });
        });
        const handler = new JobHandler.default();
        const params = Object.assign({}, ...[DEFAULT_PARAMETERS]);
        try {
            await handler.process(params);
        } catch (thrownError) {
            error = thrownError;
        }
        expect(GetJobs.getJob).toHaveBeenCalledTimes(1);
        expect(CancelJobs.cancelJobForJob).toHaveBeenCalledTimes(1);
        expect(error).toBeDefined();
        expect(error instanceof ImperativeError).toBe(true);
        expect(error.message).toMatchSnapshot();
    });
});
