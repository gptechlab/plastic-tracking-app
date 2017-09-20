/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Initialize Firebase
var config = {
    apiKey: "APIKEY",
    authDomain: "projectname.firebaseapp.com",
    databaseURL: "https://projectname.firebaseio.com",
    projectId: "projectname",
    storageBucket: "projectname.appspot.com",
    messagingSenderId: "930646272437"
};
firebase.initializeApp(config);
var database = firebase.database();

document.addEventListener("deviceready", onDeviceReady, false);
var img, lat, long, ts, typeoftrash, brand, base64, count, lastpics;

function onDeviceReady() {

    $("#cameraTakePicture").click(function() {
        $("#logopng").animate({ "opacity": 0 }, function() { $("#buttonbox").animate({ "top": -200 }, function() { cameraTakePicture(); }) }) //;
    });
    $("#donebutton").click(function() {
        postTrash();
    });

    console.log('camera ready');
    updateCount();
    updateGPSAndPics();
}

function addPic(key, address) {
    storageRef = firebase.storage().ref().child(address).getDownloadURL().then(function(url) {

        $("#camerareel").prepend("<img class='biggable' id='" + key + "' style='width:10%;opacity:0.9;display:none' src='" + url + "'/>");
        $("#" + key).fadeIn(2000);
    });
}

function cameraTakePicture() {


    navigator.camera.getPicture(onCameraSuccess, onCameraFail, {
        quality: 30,
        encodingType: Camera.EncodingType.JPEG,
        destinationType: Camera.DestinationType.DATA_URL,
        encodingType: Camera.EncodingType.JPEG,
        correctOrientation: true
    });

    function onCameraSuccess(imageData) {
        //var image = document.getElementById('myImage');
        img = "data:image/jpeg;base64," + imageData;
        base64 = imageData;
        $("#myImage").attr("src", "data:image/jpeg;base64," + imageData).fadeIn(1000);
        $("#tagbox").fadeIn(1500);
        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError);
    }

    function onCameraFail(message) {
        $("#buttonbox").animate({ "top": "50%" }, function() { $("#logopng").animate({ "opacity": 1 }) })
        //alert('Failed because: ' + message);
    }
    var onGPSSuccess = function(position) {
        /*alert('Latitude: ' + position.coords.latitude + '\n' +
            'Longitude: ' + position.coords.longitude + '\n' +
            'Altitude: ' + position.coords.altitude + '\n' +
            'Accuracy: ' + position.coords.accuracy + '\n' +
            'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
            'Heading: ' + position.coords.heading + '\n' +
            'Speed: ' + position.coords.speed + '\n' +
            'Timestamp: ' + position.timestamp + '\n');*/
        $("#coords").html(position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4))

        lat = position.coords.latitude;
        long = position.coords.longitude;
        ts = position.timestamp;

    };

    // onError Callback receives a PositionError object
    //
    function onGPSError(error) {
        alert('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    }
}

function updateCount() {
    firebase.database().ref().child('rubbish').on("value", function(snapshot) {
        $("#trashcount").text(snapshot.numChildren());
        count = snapshot.numChildren();
    })
}

function updateGPSAndPics() {
    navigator.geolocation.getCurrentPosition(function(position) {
        $("#gpsmsg").text("Current Location: ");
        $("#gps").text(position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4))
    }, function() {
        $("#gpsmsg").text("location not found. Please turn on GPS / Location tracking");
        $("#gps").text("");
    });
    firebase.database().ref().child('rubbish').orderByChild('ts').limitToLast(10).once('value').then(function(snapshot) {
        var list = Object.values(snapshot.val());
        if (JSON.stringify(lastpics) !== JSON.stringify(snapshot)) {
            $('#camerareel').fadeOut().html("").fadeIn();

            for (var p = 0; p < Object.values(snapshot.val()).length; p++) {

                addPic(Object.keys(snapshot.val())[p], Object.values(snapshot.val())[p].url);
            }
            setTimeout(function() {
                $(".biggable").click(function() {
                    console.log($(this).attr('src'));
                    $("html").prepend("<img id='coverimage' style='display:none;position:absolute;width:70%;left:50%;top:50%;transform: translate(-50%, -50%);z-index:2' src='"+$(this).attr('src')+"'>");
                    $("#coverimage").fadeIn().click(function(){
                        $(this).fadeOut();
                    })
                })
            }, 2000)
            lastpics = snapshot;
        }
    });
    setTimeout(function() {
        updateGPSAndPics();
    }, 4000)
}


function postTrash() {
    typeoftrash = $("#typeoftrash").val();
    brand = $("#brand").val();
    console.log("\nts: " + ts + "\nlat: " + lat + "\nlong: " + long + "\ntypeoftrash: " + typeoftrash + "\nbrand: " + brand);

    $("#tagbox").fadeOut(200, function() { $("#myImage").fadeOut(200, function() { $("#myImage").removeAttr('src'); }) });

    //Add Push to DB here: ;
    var rootRef = firebase.database().ref();
    var storesRef = rootRef.child('rubbish');
    var newStoreRef = storesRef.push();
    var tosend = {
        ts: ts,
        lat: lat,
        long: long,
        typeoftrash: typeoftrash,
        brand: brand,
        url: "/rubbish/" + newStoreRef.key + ".jpeg"
    }
    newStoreRef.set(tosend);

    storageRef = firebase.storage().ref().child("/rubbish/" + newStoreRef.key + ".jpeg");
    storageRef.putString(base64, 'base64');
    $("#buttonbox").animate({ "top": "50%" }, function() { $("#logopng").animate({ "opacity": 1 }) })

    //Push to Storage

}

function startCamera() {
    var options = {
        x: 0,
        y: 0,
        width: window.screen.width,
        height: window.screen.height,
        toBack: false,
        tapPhoto: true,
        tapFocus: false,
        previewDrag: false
    };
    console.log("00");
    CameraPreview.startCamera(options);
    console.log("01");
    CameraPreview.show();
}
