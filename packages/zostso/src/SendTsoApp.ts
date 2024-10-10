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

import { AbstractSession, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "@zowe/core-for-zowe-sdk";
import { IStartTsoParms } from "./doc/input/IStartTsoParms";
import { TsoValidator } from "./TsoValidator";
import { noAccountNumber, TsoConstants } from "./TsoConstants";
import { IASAppResponse } from "./doc/IASAppResponse";
import { ITsoAppCommunicationParms } from "./doc/input/ITsoAppCommunicationParms";
/**
 * Send message to TSO App running at an address space
 * @export
 * @class SendTsoApp
 */
export class SendTsoApp {
    /**
     * Start TSO application at address space with provided parameters.
     * @static
     * @param {AbstractSession} session - z/OSMF connection info
     * @param {string}  accountNumber - this key of IStartTsoParms required, because it cannot be default.
     * @param {IStartTsoParms} parms - optional object with required parameters, @see {IStartTsoParms}
     * @returns {Promise<IASAppResponse>} command response on resolve, @see {IASAppResponse}
     * @memberof StartTso
     */
    public static async send(
        session: AbstractSession,
        accountNumber: string,
        params: ITsoAppCommunicationParms,
        startParms: IStartTsoParms
    ): Promise<IASAppResponse> {
        TsoValidator.validateSession(session);
        TsoValidator.validateNotEmptyString(
            accountNumber,
            noAccountNumber.message
        );

        const endpoint = `${TsoConstants.RESOURCE}/app/${params.servletKey}/${params.appKey}`;
        const apiResponse =
            await ZosmfRestClient.putExpectJSON<IASAppResponse&{ver: string}>(
                session,
                endpoint,
                [Headers.CONTENT_TYPE, "text/plain"],
                params.message
            );
            const formattedApiResponse: IASAppResponse = {
                version: apiResponse.ver,
                reused: apiResponse.reused,
                timeout: apiResponse.timeout,
                servletKey: apiResponse.servletKey ?? null,
                queueID: apiResponse.queueID ?? null,
                tsoData: apiResponse.tsoData.map((message: any) => ({
                    VERSION: message["TSO MESSAGE"].VERSION,
                    DATA: message["TSO MESSAGE"].DATA,
                })),
            };
        return formattedApiResponse;
    }
}
