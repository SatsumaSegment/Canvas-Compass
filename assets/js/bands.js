// Global Variables
var searchButton = $("#search-button");
var clearButton = $("#historyClear");
var locateBand = [];
var historyButton = $("#dropdownList");

// Display Artist
async function displayArtistData(event, hist) {
  event.preventDefault();

  // Validator to check if user is accessing history or doing a search
  if (arguments.length === 1) {
    // Grab user's input
    var input = $("#search-input").val();
  } else {
    var input = hist;
  }

  // Checkboxes
  var pastC = $("#checkbox-1");
  var upcomingC = $("#checkbox-2");

  // Validation for checkboxes - past, upcoming and all gigs
  if (pastC.is(":checked") && !upcomingC.is(":checked")) {
    var time = "Past";
  } else if (upcomingC.is(":checked") && !pastC.is(":checked")) {
    var time = "Upcoming";
  } else if (upcomingC.is(":checked") && pastC.is(":checked")) {
    var time = "All";
  } else {
    var time = "";
  }

  // API URL
  var queryURL = `https://rest.bandsintown.com/artists/${input}/events?app_id=foo&date=${time}`;

  // Artist information and variables
  var imgDiv = $("#artistImg");
  var nameDiv = $("#artistName");
  var btnDiv = $("#artistButtons");

  // Empty any old contents
  imgDiv.empty();
  nameDiv.empty();
  btnDiv.empty();

  // Fetch Data
  await fetch(queryURL)
    .then(function (response) {
      // If 404 - not found error is returned
      if (response.status === 404) {
        console.log("404 - Not Found :(");
        var noImg = $(
          `<img src='https://placehold.jp/ffffff/000000/720x722.png?text=No%20Upcoming%20Events%20With%20This%20Artist' class="img-fluid rounded-start" alt="...">`
        );
        var noResults = $(
          `<h3 style="text-align: center;" class="align-middle">Sorry, Artist Cannot Be Found</h3>`
        );
        nameDiv.append(noResults);
        imgDiv.append(noImg);
        return;

        // If there is no 404 error
      } else {
        return response.json();
      }
    })
    .then(async function (data) {
      // Check if data is returned
      if (data == "") {
        // If no data, check band's past to get information to return
        await fetch(
          `https://rest.bandsintown.com/artists/${input}/events?app_id=foo&date=Past`
        )
          .then(function (response) {
            return response.json();
          })
          .then(function (dta) {
            // Show band and tell user no upcoming gigs
            locateBand = [];
            var noGig = $(
              `<h4 style="text-align: center;" class="align-middle">This Artist Has No Upcoming Events</h4>`
            );
            var artistName = dta[0].artist.name;
            var artistImage = dta[0].artist.image_url;
            var artistH1 = $(`<h1 class="card-title">${artistName}</h1>`).attr(
              "style",
              "text-align: center;"
            );
            nameDiv.append(artistH1);
            imgDiv.append(
              $(
                `<img src='${artistImage}' class="img-fluid rounded-start" alt="${artistName}">`
              )
            );
            btnDiv.append(noGig);
            // Call addHistory, pass in artist's name so artists without upcoming gigs get added too
            if (!hist) {
              addHistory(artistName);
            }
            return;
          });
        return;
      }

      // This code executes if data is populated (upcoming if checked and band has upcoming gigs)
      // Artist Information
      var artistName = data[0].artist.name;
      var artistImage = data[0].artist.image_url;

      // Image and Name
      var img = $(
        `<img src='${artistImage}' class="img-fluid rounded-start" alt="${artistName}">`
      );
      var artistH1 = $(`<h1 class="card-title">${artistName}</h1>`).attr(
        "style",
        "text-align: center;"
      );

      imgDiv.append(img);
      nameDiv.append(artistH1);

      // Links to Socials
      var artistLinks = data[0].artist.links;
      var filtered = artistLinks.filter(
        (val) =>
          val.type === "soundcloud" ||
          val.type === "spotify" ||
          val.type === "twitter"
      );

      filtered.forEach(function (LK) {
        // Buttons
        var linkName = LK.type.charAt(0).toUpperCase() + LK.type.slice(1);
        var linkURL = LK.url;

        var linkButton = $(
          `<a href="${linkURL}" class="btn btn-primary" type="button">${linkName}</a>`
        );

        btnDiv.append(linkButton);
      });

      locateBand = []; // Empty old info from array

      // Venue Information
      data.forEach(function (ID) {
        console.log(ID.lineup[0]);
        // Venue Location
        var srtTime = ID.starts_at;
        var venue = ID.venue;
        var strAd = venue.street_address;
        var lat = venue.latitude;
        var lng = venue.longitude;
        var loc = venue.location;
        var name = venue.name;
        var artName = ID.lineup[0];
        var latLng = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          street: strAd,
          location: loc,
          venueName: name,
          startTime: srtTime,
          artist: artName,
        };
        locateBand.push(latLng); // Add all info to array
      });
      // Add to history if it is a new search
      if (!hist) {
        addHistory(artistName);
      }
    });
}

// Add History
function addHistory(name) {
  var existingHistory = JSON.parse(localStorage.getItem("history")) || [];

  if (existingHistory.length > 4) {
    existingHistory.splice(0, 1);
  }

  var artistName = name;

  existingHistory.push(artistName);

  localStorage.removeItem("history");
  localStorage.setItem("history", JSON.stringify(existingHistory));

  var dropdown = $("#dropdownList");
  dropdown.empty();
  existingHistory.forEach(function (Name) {
    var listEl = $("<li>");
    var buttonEl = $(
      '<button class="dropdown-item" id="historyButton"></button>'
    )
      .attr("data-name", Name.toString())
      .text(Name);
    listEl.append(buttonEl);
    dropdown.append(listEl);
  });
}

// Removing History
function removeHistory(event) {
  event.preventDefault();
  localStorage.clear("history");
  artistHistory = [];
  var dropdown = $("#dropdownList");
  dropdown.empty();
}

async function historyArtistData(event) {
  var input = event.target.textContent;
  await displayArtistData(event, input);
}

// Load history upon page load
var dropdown = $("#dropdownList");
var existingHistory = JSON.parse(localStorage.getItem("history")) || [];
existingHistory.forEach(function (Name) {
  var listEl = $("<li>");
  var buttonEl = $('<button class="dropdown-item" id="historyButton"></button>')
    .attr("data-name", Name.toString())
    .text(Name);
  listEl.append(buttonEl);
  dropdown.append(listEl);
});

// Listen for clicks on clear button
clearButton.on("click", removeHistory);