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

import { PMFConstants } from "../PMFConstants";
import * as path from "path";
import * as fs from "fs";
import { readFileSync, writeFileSync } from "jsonfile";
import { IPluginJson } from "../../doc/IPluginJson";
import { Logger } from "../../../../../logger";
import { IImperativeConfig } from "../../../doc/IImperativeConfig";
import { ImperativeError } from "../../../../../error";
import { IPluginJsonObject } from "../../doc/IPluginJsonObject";
import { getPackageInfo, installPackages, NpmRegistryInfo } from "../NpmFunctions";
import { ConfigSchema } from "../../../../../config/src/ConfigSchema";
import { PluginManagementFacility } from "../../PluginManagementFacility";
import { ConfigurationLoader } from "../../../ConfigurationLoader";
import { UpdateImpConfig } from "../../../UpdateImpConfig";
import { CredentialManagerOverride, ICredentialManagerNameMap } from "../../../../../security";
import { IProfileTypeConfiguration } from "../../../../../profiles";
import * as semver from "semver";
import { ConfigUtils } from "../../../../../config";
import { IExtendersJsonOpts } from "../../../../../config/src/doc/IExtenderOpts";

// Helper function to update extenders.json object during plugin install.
// Returns true if the object was updated, and false otherwise
export const updateExtendersJson = (
    extendersJson: IExtendersJsonOpts,
    packageInfo: { name: string; version: string; },
    profile: IProfileTypeConfiguration): boolean => {
    if (!(profile.type in extendersJson.profileTypes)) {
        // If the type doesn't exist, add it to extenders.json and return
        extendersJson.profileTypes[profile.type] = {
            from: [packageInfo.name],
            version: profile.schema.version
        };
        return true;
    }

    // Otherwise, only update extenders.json if the schema version is newer
    const existingTypeInfo = extendersJson.profileTypes[profile.type];
    if (semver.valid(existingTypeInfo.version)) {
        if (profile.schema.version && semver.lt(profile.schema.version, existingTypeInfo.version)) {
            return false;
        }
    }

    extendersJson.profileTypes[profile.type] = {
        from: [packageInfo.name],
        version: profile.schema.version
    };
    return true;
};

/**
 * Common function that abstracts the install process. This function should be called for each
 * package that needs to be installed. (ex: `sample-cli plugin install a b c d` -> calls install 4
 * times)
 *
 * @TODO work needs to be done to support proper sharing of the plugins.json. As of now local plugins can only be reinstalled on the same machine.
 * (due to how the conversion to an absolute URI happens)
 *
 * @param {string} packageLocation A package name or location. This value can be a valid npm package
 *                                 name or the location of an npm tar file or project folder. Also,
 *                                 git URLs are also acceptable here (basically anything that `npm
 *                                 install` supports). If this parameter is a relative path, it will
 *                                 be converted to an absolute path prior to being passed to the
 *                                 `npm install` command.
 *
 * @param {NpmRegistryInfo} registryInfo The npm registry to use.
 *
 * @param {boolean} [installFromFile=false] If installing from a file, the package location is
 *                                          automatically interpreted as an absolute location.
 *                                          It is assumed that the plugin.json file was previously
 *                                          generated by this function which always ensures an
 *                                          absolute path. Also, if this is true, we will not update
 *                                          the plugins.json file since we are not adding/modifying
 *                                          it.
 * @returns {string} The name of the plugin.
 */
export async function install(packageLocation: string, registryInfo: NpmRegistryInfo, installFromFile = false) {
    const iConsole = Logger.getImperativeLogger();
    let npmPackage = packageLocation;

    iConsole.debug(`Installing package: ${packageLocation}`);

    // Do some parsing on the package location in the case it isn't an absolute location
    // If
    //   we are not installing from a file
    //   and the location is not absolute.
    // Then
    //   we will try to convert the URI (which is a file path by the above criteria)
    //   to an absolute file path. If we can't resolve it locally, we'll leave it up to npm
    //   to do what's best.
    if (
        !installFromFile &&
        !path.isAbsolute(packageLocation)
    ) {
        const tempLocation = path.resolve(npmPackage);

        iConsole.debug(`Package is not absolute, let's see if this is a local file: ${tempLocation}`);

        // Now that we have made the location absolute...does it actually exist
        if (fs.existsSync(tempLocation)) {
            npmPackage = tempLocation;
            iConsole.info(`Installing local package: ${npmPackage}`);
        }
    }

    try {
        iConsole.debug(`Installing from registry ${registryInfo.location}`);

        // Perform the npm install.
        iConsole.info("Installing packages...this may take some time.");

        installPackages(npmPackage, {
            prefix: PMFConstants.instance.PLUGIN_INSTALL_LOCATION,
            ...registryInfo.buildRegistryArgs(),
        });

        // We fetch the package name and version of newly installed plugin
        const packageInfo = await getPackageInfo(npmPackage);
        const packageName = packageInfo.name;
        let packageVersion = packageInfo.version;

        iConsole.debug("Reading in the current configuration.");
        const installedPlugins: IPluginJson = readFileSync(PMFConstants.instance.PLUGIN_JSON);

        // Set the correct name and version by checking if package is an npm package, this is done
        // by searching for a / or \ as those are not valid characters for an npm package, but they
        // would be for a url or local file.
        if (packageLocation.search(/(\\|\/)/) === -1) {
            // Getting here means that the package installed was an npm package. So the package property
            // of the json file should be the same as the package name.
            npmPackage = packageName;

            const passedVersionIdx = packageLocation.indexOf("@");
            if (passedVersionIdx !== -1) {
                packageVersion = packageLocation.substring(passedVersionIdx + 1);
            }
        }

        iConsole.debug(`Package version: ${packageVersion}`);

        const newPlugin: IPluginJsonObject = {
            package: npmPackage,
            location: registryInfo.location,
            version: packageVersion
        };
        iConsole.debug("Updating the current configuration with new plugin:\n" +
            JSON.stringify(newPlugin, null, 2));

        installedPlugins[packageName] = newPlugin;

        iConsole.debug("Updating configuration file = " + PMFConstants.instance.PLUGIN_JSON);
        writeFileSync(PMFConstants.instance.PLUGIN_JSON, installedPlugins, {
            spaces: 2
        });

        // get the plugin's Imperative config definition
        const requirerFunction = PluginManagementFacility.instance.requirePluginModuleCallback(packageName);
        const pluginImpConfig = ConfigurationLoader.load(null, packageInfo, requirerFunction);

        iConsole.debug(`Checking for global Zowe client configuration files to update.`);
        if (PMFConstants.instance.PLUGIN_USING_CONFIG)
        {
            // Update the Imperative Configuration to add the profiles introduced by the recently installed plugin
            // This might be needed outside of PLUGIN_USING_CONFIG scenarios, but we haven't had issues with other APIs before
            const globalLayer = PMFConstants.instance.PLUGIN_CONFIG.layers.find((layer) => layer.global && layer.exists);
            if (globalLayer && Array.isArray(pluginImpConfig.profiles)) {
                UpdateImpConfig.addProfiles(pluginImpConfig.profiles);
                const schemaInfo = PMFConstants.instance.PLUGIN_CONFIG.getSchemaInfo();
                if (schemaInfo.local && fs.existsSync(schemaInfo.resolved)) {
                    let loadedSchema: IProfileTypeConfiguration[];
                    try {
                        // load schema from disk to prevent removal of profile types from other applications
                        loadedSchema = ConfigSchema.loadSchema(readFileSync(schemaInfo.resolved));
                    } catch (err) {
                        iConsole.error("Error when adding new profile type for plugin %s: failed to parse schema", newPlugin.package);
                    }

                    // Only update global schema if we were able to load it from disk
                    if (loadedSchema != null) {
                        const existingTypes = loadedSchema.map((obj) => obj.type);
                        const extendersJson = ConfigUtils.readExtendersJson();

                        // Determine new profile types to add to schema
                        let shouldUpdate = false;
                        for (const profile of pluginImpConfig.profiles) {
                            if (!existingTypes.includes(profile.type)) {
                                loadedSchema.push(profile);
                            } else {
                                const existingType = loadedSchema.find((obj) => obj.type === profile.type);
                                if (semver.valid(existingType.schema.version)) {
                                    if (semver.valid(profile.schema.version) && semver.gt(profile.schema.version, existingType.schema.version)) {
                                        existingType.schema = profile.schema;
                                        existingType.schema.version = profile.schema.version;
                                    }
                                } else {
                                    existingType.schema = profile.schema;
                                    existingType.schema.version = profile.schema.version;
                                }
                            }
                            shouldUpdate = updateExtendersJson(extendersJson, packageInfo, profile) || shouldUpdate;
                        }

                        if (shouldUpdate) {
                            // Update extenders.json (if necessary) after installing the plugin
                            ConfigUtils.writeExtendersJson(extendersJson);
                        }
                        const schema = ConfigSchema.buildSchema(loadedSchema);
                        ConfigSchema.updateSchema({ layer: "global", schema });
                    }
                }
            }
        }

        // call the plugin's postInstall function
        await callPluginPostInstall(packageName, pluginImpConfig);

        iConsole.info("Plugin '" + packageName + "' successfully installed.");
        return packageName;
    } catch (e) {
        throw new ImperativeError({
            msg: e.message,
            causeErrors: e
        });
    }
}

/**
 * Call a plugin's lifecycle hook to enable a plugin to take some action
 * after the plugin has been installed.
 *
 * @param pluginPackageNm The package name of the plugin being installed.
 * @param pluginImpConfig The imperative configuration for this plugin.
 *
 * @throws ImperativeError.
 */
async function callPluginPostInstall(
    pluginPackageNm: string, pluginImpConfig: IImperativeConfig
): Promise<void> {
    const impLogger = Logger.getImperativeLogger();
    if ( pluginImpConfig.pluginLifeCycle === undefined) {
        // pluginPostInstall was not defined by the plugin
        const credMgrInfo: ICredentialManagerNameMap =
            CredentialManagerOverride.getCredMgrInfoByPlugin(pluginPackageNm);
        if (credMgrInfo !== null) {
            // this plugin is a known cred mgr override
            throw new ImperativeError({
                msg: `The plugin '${pluginPackageNm}' attempted to override the CLI ` +
                `Credential Manager without providing a 'pluginLifeCycle' class. ` +
                `The previous Credential Manager remains in place.`
            });
        }
        return;
    }

    // call the plugin's postInstall operation
    try {
        impLogger.debug(`Calling the postInstall function for plugin '${pluginPackageNm}'`);
        const requirerFun = PluginManagementFacility.instance.requirePluginModuleCallback(pluginPackageNm);
        const lifeCycleClass = requirerFun(pluginImpConfig.pluginLifeCycle);
        const lifeCycleInstance = new lifeCycleClass();
        await lifeCycleInstance.postInstall();
    } catch (err) {
        throw new ImperativeError({
            msg: `Unable to perform the post-install action for plugin '${pluginPackageNm}'.` +
            `\nReason: ${err.message}`
        });
    }
}

/* The following functions are private to this module. Breaking changes
 * might be made at any time to any of the following functions.
 * Make no attempt to to call them externally.
 * They are only exported here to enable automated testing.
 * Only test programs should access 'onlyForTesting'.
 */
export const onlyForTesting = {
    callPluginPostInstall: callPluginPostInstall
};
