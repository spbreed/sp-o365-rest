﻿(function () {
  'use strict';

  /**
   * View model used for the page in binding with knockout.js
   */
  var DriversModel = function () {
    var self = this;
    self.drivers = ko.observableArray([]);
    self.submitAsBatch = ko.observable(false);

    /**
     * @name getAllDrivers
     * @description 
     * Gets all drivers from the SharePoint 'Drivers' list & stuffs them into an observable array.
     */
    self.getAllDrivers = function () {
      console.log('getAllDrivers()');

      // build endpoint
      var endpoint = _spPageContextInfo.webAbsoluteUrl
                    + '/_api/web/lists/getbytitle(\'Drivers\')'
                    + '/items?$orderby=Title';

      var requestHeaders = {
        'ACCEPT': 'application/json;odata=verbose'
      };

      // issue request
      return jQuery.ajax({
        url: endpoint,
        type: 'GET',
        headers: requestHeaders
      }
      ).done(function (response) {
        console.log(response);
        // clear the view model
        self.drivers([]);
        // set response > drivers collection
        self.drivers(response.d.results);
      });

    }

    /**
     * @name addDrivers
     * @description
     * Creates a JSON array of drivers to add to the SharePoint 'Drivers' list. 
     * 
     * @param {string} teamId - Name of the F1 team to add two drivers for (mercedes / ferrari / redbull).
     */
    self.addDrivers = function (teamId) {
      console.log('addDrivers()');

      var driversAsJson = undefined;

      switch (teamId) {
        // if mercedes.... GRRR
        case 'mercedes':
          driversAsJson = [
            {
              __metadata: {
                type: 'SP.Data.DriversListItem'
              },
              Title: 'Nico Rossberg',
              Team: 'Mercedes'
            },
            {
              __metadata: {
                type: 'SP.Data.DriversListItem'
              },
              Title: 'Lewis Hamilton',
              Team: 'Mercedes'
            }
          ];
          break;
          // if ferrari..... WOOT!
        case 'ferrari':
          driversAsJson = [
            {
              __metadata: {
                type: 'SP.Data.DriversListItem'
              },
              Title: 'Fernando Alonso',
              Team: 'Ferrari'
            },
            {
              __metadata: {
                type: 'SP.Data.DriversListItem'
              },
              Title: 'Filipe Massa',
              Team: 'Ferrari'
            }
          ];
          break;
          // if red bull.... BOOOO!
        case 'redbull':
          driversAsJson = [
            {
              __metadata: {
                type: 'SP.Data.DriversListItem'
              },
              Title: 'Sebastian Vettel',
              Team: 'Red Bull'
            },
            {
              __metadata: {
                type: 'SP.Data.DriversListItem'
              },
              Title: 'Mark Webber',
              Team: 'Red Bull'
            }
          ];
          break;
      }

      addTeamDrivers(driversAsJson);
    }

    /**
     * @name addTeamDrivers
     * @description
     * Takes a collection of drivers and adds them to the SharePoint 'Drivers' list.
     * This doesn't create the drivers, rather it calls other internal functions that create them using
     * a single batch request or multiple requests.
     * 
     * @param {Array{Object}} driversAsJson - JSON array of drivers to add.
     * 
     */
    function addTeamDrivers(driversAsJson) {
      console.log('addTeamDrivers()' + driversAsJson);

      // send single request or batch?
      if (self.submitAsBatch() === true) {
        addTeamDriversBatchRequest(driversAsJson);
      } else {
        addTeamDriverMultipleRequests(driversAsJson);
      }
    }

    /**
     * @name addTeamDriversBatchRequest
     * @description
     * Adds drivers in a single batch request.
     * 
     * @param {Array{Object}} driversAsJson - JSON array of drivers to add.
     */
    function addTeamDriversBatchRequest(driversAsJson) {
      console.log('addTeamDriversBatchRequest()', driversAsJson);
      alert('$batch not supported yet');
    }

    /**
     * @name deleteDriversMultipleRequests
     * @description
     * Adds drivers in multiple HTTP requests (one per driver).
     *
     * @param {Array{Object}} driversAsJson - JSON array of drivers to add.
     */
    function addTeamDriverMultipleRequests(driversAsJson) {
      console.log('addTeamDriversMultipleRequests()', driversAsJson);

      // build request endpoint
      var endpoint = _spPageContextInfo.webAbsoluteUrl
                  + '/_api/web/lists/getbytitle(\'Drivers\')'
                  + '/items';

      // build common request headers
      var requestHeaders = {
        'ACCEPT': 'application/json;odata=verbose',
        'CONTENT-TYPE': 'application/json;odata=verbose',
        'X-REQUESTDIGEST': jQuery("#__REQUESTDIGEST").val()
      };

      // will store requests in promise array
      var jobs = [];

      // loop through all drivers and create separate requests for each one...
      for (var driverIndex = 0; driverIndex < driversAsJson.length; driverIndex++) {

        // create request...
        var promise = jQuery.ajax({
          url: endpoint,
          type: 'POST',
          headers: requestHeaders,
          data: JSON.stringify(driversAsJson[driverIndex]),
          success: function (response) {
            console.log('.. add driver PASS ', response);
          },
          fail: function (error) {
            console.log('.. add driver FAIL ', error);
          }
        });

        // add the request to the collection of jobs
        console.log('.. create driver add request # ' + driverIndex);
        jobs.push(promise);
      }

      console.log('request jobs', jobs);

      // when all jobs are complete...
      Q.all(jobs)
        .then(function () {
          console.log('all requests finished');
          // refresh the collection
          self.getAllDrivers();
        });

    }

    /**
     * @name updateDrivers
     * @description
     * Updates the Ferrari & Red Bull teams > 2014 drivers.
     */
    self.updateDrivers = function () {
      console.log('updateDrivers()');

      var driverToUpdate = undefined;
      var driversToUpdate = [];

      // update ferrari
      driverToUpdate = self.drivers().filter(function(driver) {
        return (driver.Title == 'Filipe Massa');
      })[0];
      driverToUpdate.Title = 'Kimi Räikkönen';
      driversToUpdate.push(driverToUpdate);

      // update red bull
      driverToUpdate = self.drivers().filter(function(driver) {
        return (driver.Title == 'Mark Webber');
      })[0];
      driverToUpdate.Title = 'Daniel Ricciardo';
      driversToUpdate.push(driverToUpdate);


      // send single request or batch?
      if (self.submitAsBatch() === true) {
        updateTeamDriversBatchRequest(driversToUpdate);
      } else {
        updateTeamDriversMultipleRequests(driversToUpdate);
      }
    }

    /**
     * @name updateTeamDriversBatchRequest
     * @description
     * Submits the updates as a single batch request.
     * 
     * @param {Array{Object}} driversToUpdate - JSON array of drivers to update.
     */
    function updateTeamDriversBatchRequest(driversToUpdate) {
      console.log('updateTeamDriversBatchRequest()' + driversToUpdate);
      alert('$batch not supported yet');
    }

    /**
     * @name updateTeamDriversMultipleRequests
     * @description
     * Submits the updates in multiple requests (one per update).
     * 
     * @param {Array{Object}} driversToUpdate - JSON array of drivers to update.
     */
    function updateTeamDriversMultipleRequests(driversToUpdate) {
      console.log('updateTeamDriversMultipleRequest()' + driversToUpdate);

      // store all jobs
      var jobs = [];

      for (var driverIndex = 0; driverIndex < driversToUpdate.length; driverIndex++) {

        var driver = driversToUpdate[driverIndex];

        var requestHeaders = {
          'ACCEPT': 'application/json;odata=verbose',
          'CONTENT-TYPE': 'application/json;odata=verbose',
          'X-REQUESTDIGEST': jQuery("#__REQUESTDIGEST").val(),
          'X-HTTP-METHOD': 'MERGE',
          'IF-MATCH': driver.__metadata.etag
        };

        // create the request endpoint
        var endpoint = _spPageContextInfo.webAbsoluteUrl
          + '/_api/web/lists/getbytitle(\'Drivers\')'
          + '/items(' + driver.Id + ')';

        // convert driver > update object
        var driverUpdater = {
          __metadata: {
            'type': driver.__metadata.type
          },
          Title: driver.Title
        };

        // create request...
        var promise = jQuery.ajax({
          url: endpoint,
          type: 'POST',
          headers: requestHeaders,
          data: JSON.stringify(driverUpdater),
          success: function (response) {
            console.log('.. update driver PASS ', response);
          },
          fail: function (error) {
            console.log('.. update driver FAIL ', error);
          }
        });

        // add the request to the collection of jobs
        console.log('.. created driver update request # ' + driverIndex);
        jobs.push(promise);
      }

      // when all jobs are complete...
      Q.all(jobs)
        .then(function () {
          console.log('all requests finished');
          // refresh the collection
          self.getAllDrivers();
        });
    }

    /**
     * @name deleteAllDrivers
     * @description
     * Based on the flag if batches should be used, deletes all the drivers from the SharePoint 'Drivers
     * list using multiple HTTP requests or a single batch request.
     */
    self.deleteAllDrivers = function () {
      // send single request or batch?
      if (self.submitAsBatch() === true) {
        deleteDriversBatchRequest();
      } else {
        deleteDriversMultipleRequests();
      }
    }

    /**
     * @name deleteDriversBatchRequest
     * @description
     * Deletes all drivers in a single HTTP request.
     */
    function deleteDriversBatchRequest() {
      console.log('deleteDriversBatchRequest()');
      alert('$batch not supported yet');
    }

    /**
     * @name deleteDriversMultipleRequests
     * @description
     * Deletes all drivers using multiple HTTP requests (one per driver).
     */
    function deleteDriversMultipleRequests() {
      console.log('deleteDriversMultipleRequests()');

      // store all jobs
      var jobs = [];

      var requestHeaders = {
        'ACCEPT': 'application/json;odata=verbose',
        'X-REQUESTDIGEST': jQuery("#__REQUESTDIGEST").val(),
        'If-Match': '*'
      };

      for (var driverIndex = 0; driverIndex < self.drivers().length; driverIndex++) {

        var driver = self.drivers()[driverIndex];

        // create the request endpoint
        var endpoint = _spPageContextInfo.webAbsoluteUrl
                       + '/_api/web/lists/getbytitle(\'Drivers\')'
                       + '/items(' + driver.Id + ')';

        // create request...
        var promise = jQuery.ajax({
          url: endpoint,
          type: 'DELETE',
          headers: requestHeaders,
          success: function (response) {
            console.log('.. delete driver PASS ', response);
          },
          fail: function (error) {
            console.log('.. delete driver FAIL ', error);
          }
        });

        // add the request to the collection of jobs
        console.log('.. created driver delete request # ' + driverIndex);
        jobs.push(promise);
      }

      // when all jobs are complete...
      Q.all(jobs)
        .then(function () {
          console.log('all requests finished');
          // refresh the collection
          self.getAllDrivers();
        });
    }

  }

  /**
   * Attach the view model to the page & enable all buttons.
   */
  jQuery(document).ready(function () {
    // create & bind the view model it to the page
    ko.applyBindings(new DriversModel());

    // enable all buttons now that the scripts have loaded & view model is bound
    jQuery('input[type="button"]').removeAttr('disabled');
  });
})();