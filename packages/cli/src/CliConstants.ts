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

/**
 * Class to contain CLI constants
 * @export
 * @class CliConstants
 */
export class CliConstants {

    /**
     * Custom log location to prevent logging to default folder based on the package name
     * @static
     * @memberof CliConstants
     */
    public static readonly LOG_LOCATION = "zowe/logs/zowe.log";

    /**
     * Display name
     * @static
     * @memberof CliConstants
     */
    public static readonly DISPLAY_NAME = "Zowe CLI";

    /**
     * Binary executable name
     * @static
     * @memberof CliConstants
     */
    public static readonly BINARY_NAME = "zowe";

    /**
     *
     * Documentation link for the CLI
     * @static
     * @memberof CliConstants
     */
    public static readonly DOCUMENTATION_LINK = "https://docs.zowe.org";

    /**
     *
     * Support link for zowe
     * @static
     * @memberof CliConstants
     */
    public static readonly SUPPORT_LINK = "https://www.zowe.org";

    /**
     * Description of product
     * @static
     * @memberof CliConstants
     */
    public static readonly DESCRIPTION =
    `Welcome to ${CliConstants.DISPLAY_NAME}!

${CliConstants.DISPLAY_NAME} is a command line interface (CLI) that provides a simple and streamlined way to interact with IBM z/OS.

For additional ${CliConstants.DISPLAY_NAME} documentation, visit ${CliConstants.DOCUMENTATION_LINK}

For ${CliConstants.DISPLAY_NAME} support, visit ${CliConstants.SUPPORT_LINK}
`;

    /**
     * Home environment variable
     * @static
     * @memberof CliConstants
     */
    public static readonly HOME_ENV_KEY = "ZOWE_CLI_HOME";


    /**
     * Prefix for environmental variable settings used by Imperative
     * @static
     * @memberof CliConstants
     */
    public static readonly ENV_PREFIX = "ZOWE";

    /**
     * Home directory
     * @static
     * @memberof CliConstants
     */
    public static readonly HOME_DIR = "~/.zowe";
}