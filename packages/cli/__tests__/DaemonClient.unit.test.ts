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

jest.mock("net");
jest.mock("@zowe/imperative");
import * as net from "net";
import getStdin = require("get-stdin");
import { IDaemonResponse, Imperative } from "@zowe/imperative";
import { DaemonClient } from "../src/DaemonClient";

describe("DaemonClient tests", () => {

    it("should process data when received", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log
                }
            },
            commandLine: "n/a",
            parse
        };

        const server: net.Server = undefined;
        const client = {
            on: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server);
        const daemonResponse: IDaemonResponse = {
            argv: ["feed", "dog"],
            cwd: "fake",
            env: {},
            stdinLength: 0,
            stdin: null
        };

        daemonClient.run();
        // force `data` call and verify input is from instantiation of DaemonClient
        // and is what is passed to mocked Imperative.parse via snapshot
        (daemonClient as any).data(JSON.stringify(daemonResponse));

        expect(parse).toHaveBeenCalled();
    });

    it("should process response with binary stdin data when received", async () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log
                }
            },
            commandLine: "n/a",
            parse
        };

        const server: net.Server = undefined;
        const client = {
            on: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server);
        const stdinData = String.fromCharCode(...Array(256).keys());
        const daemonResponse: IDaemonResponse = {
            argv: ["feed", "cat"],
            cwd: "fake",
            env: {},
            stdinLength: stdinData.length,
            stdin: null
        };
        const writeToStdinSpy = jest.spyOn(daemonClient as any, "writeToStdin").mockResolvedValueOnce(undefined);

        daemonClient.run();
        // force `data` call and verify input is from instantiation of DaemonClient
        // and is what is passed to mocked Imperative.parse via snapshot
        const stringData = JSON.stringify(daemonResponse) + "\f" + stdinData;
        await (daemonClient as any).data(stringData);

        expect(writeToStdinSpy).toHaveBeenCalledWith(stdinData, stdinData.length);
        expect(parse).toHaveBeenCalled();
    });

    it("should fail to process invalid data when received", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log,
                    logError: log
                }
            },
            commandLine: "n/a",
            parse
        };

        const server: net.Server = undefined;
        const client = {
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server);

        daemonClient.run();
        // force `data` call and verify input is from instantiation of DaemonClient
        // and is what is passed to mocked Imperative.parse via snapshot
        (daemonClient as any).data("not json");

        expect(log).toHaveBeenCalledTimes(3);
        expect(log).toHaveBeenLastCalledWith("First 1024 bytes of daemon request:\n", "not json");
        expect(parse).not.toHaveBeenCalled();
        expect(client.end).toHaveBeenCalled();
    });

    it("should ignore JSON response data used for prompting when received", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            // do nothing
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log
                }
            },
            commandLine: "n/a",
            parse
        };

        const server: net.Server = undefined;
        const client = {
            on: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server);

        daemonClient.run();
        // force `data` call and verify input is from instantiation of DaemonClient
        // and is what is passed to mocked Imperative.parse via snapshot
        const promptResponse = { stdin: "some answer" };
        (daemonClient as any).data(JSON.stringify(promptResponse));

        expect(parse).not.toHaveBeenCalled();
    });

    it("should shutdown when keyword is specified", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        const parse = jest.fn( (data, context) => {
            expect(data).toMatchSnapshot();
            expect(context).toMatchSnapshot();
        });

        (Imperative as any) = {
            api: {
                appLogger: {
                    trace: log,
                    debug: log
                }
            },
            commandLine: "n/a",
            parse
        };

        const server = {
            close: jest.fn()
        };
        const write = jest.fn((someWriteMessage) => {
            expect(someWriteMessage).toMatchSnapshot();
        });
        const client = {
            on: jest.fn(),
            write,
            end: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server as any);
        const shutdownSpy = jest.spyOn(daemonClient as any, "shutdown");
        daemonClient.run();
        // force `data` call and verify write method is called with termination message
        const shutdownResponse = { stdin: DaemonClient.CTRL_C_CHAR };
        (daemonClient as any).data(JSON.stringify(shutdownResponse));

        expect(shutdownSpy).toHaveBeenCalledTimes(1);
        expect(parse).not.toHaveBeenCalled();
    });

    it("should call the end method", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        (Imperative as any).api = {
            appLogger: {
                trace: log
            }
        };

        const server: net.Server = undefined;
        const client = {
            on: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server);
        daemonClient.run();
        (daemonClient as any).end();
        expect(log).toHaveBeenLastCalledWith('daemon client disconnected');
    });

    it("should call the close method", () => {

        const log = jest.fn(() => {
            // do nothing
        });

        (Imperative as any).api = {
            appLogger: {
                trace: log
            }
        };

        const server: net.Server = undefined;
        const client = {
            on: jest.fn()
        };

        const daemonClient = new DaemonClient(client as any, server);
        daemonClient.run();
        (daemonClient as any).close();
        expect(log).toHaveBeenLastCalledWith('client closed');
    });

    it("should be able to write to stdin multiple times", async () => {
        (DaemonClient.prototype as any).writeToStdin("X", 1);
        for (const animal of ["aardvark", "bonobo", "cheetah"]) {
            (DaemonClient.prototype as any).writeToStdin(animal, animal.length);
            expect(await getStdin()).toBe(animal);
        }
    });
});
