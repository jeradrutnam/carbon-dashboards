/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
    var DATABASE_API = ues.utils.tenantPrefix() + 'apis/database';
    var ASSET_API = ues.utils.tenantPrefix() + 'apis/assets/publicAssets/';

    /* To create usage data for the particular gadget in this dashboard
     * @param id ID of the gadget
     * @param dahshboard which the gadget belongs to
     * @returns {Array} Usage data as a JSON object
     */
    var createUsageData = function (dashboard, id) {
        var usageData = [];
        var area;
        var components;
        var length;
        var component;
        if (dashboard.pages) {
            for (var i = 0; i < dashboard.pages.length; i++) {
                var pageViewCount = 0;
                var pageUsageData = {};
                pageUsageData[dashboard.pages[i].id] = {};
                var views = Object.keys(dashboard.pages[i].content);
                for (var j = 0; j < views.length; j++) {
                    var content = dashboard.pages[i].content[views[j]];
                    var count = 0;
                    for (area in content) {
                        if (content.hasOwnProperty(area)) {
                            components = content[area];
                            length = components.length;
                            for (var k = 0; k < length; k++) {
                                component = components[k];
                                if (component.content.id === id) {
                                    count++;
                                }
                            }
                        }
                    }
                    if (count > 0) {
                        pageUsageData[dashboard.pages[i].id][views[j]] = count;
                        pageViewCount += count;
                    }
                }
                if (pageViewCount > 0) {
                    usageData.push(clone(pageUsageData));
                }
            }
        }
        return usageData;
    };

    /**
     * To update the usage data
     * @param dashboard which the component belongs to
     * @param id Id of the component id
     */
    var updateUsageData = function(dashboard, id) {
        var usageData = createUsageData(dashboard, id);

        if (usageData.length > 0) {
            sendUsageData(dashboard, usageData, id);
        } else {
            deleteUsageData(dashboard, id);
        }
    };

    /**
     * To send the usage data to back end
     * @param dashboard
     * @param usageData Usage data to be send to back end
     * @param id ID of the gadget
     */
    var sendUsageData = function (dashboard, usageData, id) {
        var dashboardID = dashboard.id;
        if (dashboard.isUserCustom){
            dashboardID = dashboardID + '$'
        }
        var state = isGadgetExist(id);
        $.ajax({
            url: DATABASE_API + '/' + dashboardID + '/' + id + '?task=insert&state='+state,
            method: "POST",
            data: JSON.stringify(usageData),
            contentType: "application/json",
            async: false,
            success: function () {
                console.log("successfully updated the usage data to database");
            },
            error: function (xhr, message) {
                console.log("something went wrong. Could not update the database data due to " + message);
            }
        });
    };

    /**
     * To delete the usage data in the back end when the relevant gadget is deleted
     * @param id ID of the gadget
     * @param dashboard which the gadget belongs to
     */
    var deleteUsageData = function (dashboard, id) {
        var dashboardID = dashboard.id;
        if (dashboard.isUserCustom){
            dashboardID = dashboardID + '$'
        }
        $.ajax({
            url: DATABASE_API + '/' + dashboardID + '/' + id + '?task=delete',
            method: "POST",
            contentType: "application/json",
            async: false,
            success: function () {
                console.log("successfully updated the usage data to database");
            },
            error: function (xhr, message) {
                console.log("something went wrong. Could not update the database data due to " + message);
            }
        });
    };


    /**
     * To check whether gadget exist in the store
     * @param id
     * @returns {string}
     */
    var isGadgetExist = function(id) {
        var status = 'ACTIVE';
        $.ajax({
            url: ASSET_API + id + '?type=gadget',
            method: 'GET',
            async: false,
            contentType: 'application/json'
        }).error(function (xhr, err) {
            if (xhr.status === 404) {
                status = 'DELETED';
            }
        });
        return status;
    };

    /**
     * Clone JSON object.
     * @param {Object} o    Object to be cloned
     * @return {Object}
     * @private
     */
    var clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };


    ds.database = {
        updateUsageData : updateUsageData
    };
}());

